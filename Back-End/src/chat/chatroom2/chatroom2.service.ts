import { PrismaService } from '../../prisma/prisma.service';
import { CreateChatroomDto } from './dto/create-chatroom2.dto';
import { Prisma, UserChannelVisibility } from '@prisma/client';
import { UserRoleInChannel} from '@prisma/client'
import { UserStatusOnChannel } from '@prisma/client'
import { BadRequestException, Injectable, ForbiddenException} from '@nestjs/common';
import { Chatroom } from '@prisma/client';
import { UserOnChannel} from '@prisma/client'
import * as argon from 'argon2';
import { UserService } from 'src/user/user.service';


@Injectable()
export class ChatroomService {
	constructor(private prisma: PrismaService,
				private userService: UserService) { }

    async create(newConv: any, userId: number) {
      const { name, isPublic, isPrivate, isProtected, password } = newConv;
      let visibility: UserChannelVisibility;
      if (isPrivate) {
        visibility = UserChannelVisibility.PRIVATE;
      } else if (isPublic) {
        visibility = UserChannelVisibility.PUBLIC;
      } else if (isProtected) {
        visibility = UserChannelVisibility.PWD_PROTECTED;
      }

      let hash: string = "";
      if (visibility == UserChannelVisibility.PWD_PROTECTED) {
        hash = await argon.hash(password ?? '');
      }

      const newChannel = await this.prisma.chatroom.create({
        data: {
          name: name,
          visibility: visibility,
          hash: hash,
        },
      });
      const userOnChannel = await this.prisma.userOnChannel.create({
        data: {
          channelId: newChannel.id,
          userId: userId,
          role: "ADMIN"
        }
      });
      return newChannel;
  }

	findAll() {
		return this.prisma.chatroom.findMany({
			include: {
				participants: true,
			},
		});
	}

  findOne(id: number) {
    return this.prisma.chatroom.findUnique({where: {id: id}});;
  }

  async getUserTable(userId: number, channelId: number) {
    const users = await this.prisma.userOnChannel.findMany( {where:
      {
        AND: [
          {userId:userId},
          {channelId: channelId},
        ],
      }})
      return users;
    }

	async createUserTable(ids: any, hash: string) {
		const { userId, channelId } = ids;
		if (hash) {
			await this.validatePassword(channelId, hash);
		}
		try {
			const newTable = await this.prisma.userOnChannel.create({
				data: {
					channelId: channelId,
					userId: userId,
				},
			});
			return newTable;
		} catch (err) {
			console.log(err);
		}
	}

	async validatePassword(id: number, hash: string): Promise<boolean> {
		const channel = await this.prisma.chatroom.findUnique({ where: { id: id } });
		if (channel.visibility === UserChannelVisibility.PWD_PROTECTED) {
			if (!hash) {
				throw new ForbiddenException(`Password is required`);
			}
		const isPasswordMatch = await argon.verify(channel.hash, hash);
		if (!isPasswordMatch) {
			throw new ForbiddenException(`Invalid password`);
		}}
		return true;
	}

  async getParticipants(channelId: number) {
    // console.log("ENTRE DANS LE SERVICE")
    const channel = await this.prisma.userOnChannel.findMany({
      where: { channelId },
      include: { user: true },
    });
      return channel;
  }

  async addAdmin(channelId: number, userId: number) {
	const users = await this.prisma.userOnChannel.findMany({
		where: { channelId },
		include: { user: true },
	  });

	if (!users || users.length === 0) {
	  throw new ForbiddenException(`User with ID ${userId} is not on channel with ID ${channelId}`);
	}

	const updatedrole = await this.prisma.userOnChannel.update({
	  where: {
		id: userId,
	  },
	  data: {
		role: UserRoleInChannel.ADMIN,
	},
	});

	return updatedrole;
}


	async openInvitations(senderId: number, channelId: number, receiverId: number) {
		const demand = await this.prisma.chatroomInvitations.create({
			data: {
				senderId: senderId,
				chatroomId: channelId,
				receiverId: receiverId,
			},
		});
		return demand
	}


	async getReceivedInvitations(userId: number) {
		try {
			const demands = await this.prisma.chatroomInvitations.findMany({
			where: {
				receiverId: userId,
			},
			include: {
				chatroom: true,
			},
		})
			return demands;
		} catch (error) {
			throw new BadRequestException('getReceivedInvitations error : ' + error);
		}
	}

	async updateInvitation(invitation: any) {
		const { invitId, response } = invitation
		const updated_invitation = await this.prisma.chatroomInvitations.update({
			where: {
				id: parseInt(invitId),
			},
			data: {
				status: response,
			},
		});
		return updated_invitation;
	}

	async addChatroom(request: any) {
		const { receiverId, chatroomId } = request;
		const newTable = await this.prisma.userOnChannel.create({
			data: {
				channelId: chatroomId,
				userId: receiverId,
			},
		});
		return newTable;
	}

	async deleteRefusedInvitations() {
		await this.prisma.chatroomInvitations.deleteMany({
			where: { status: 'REJECTED' },
		});
	}

	async removeUserFromChannel(userId: number, chatroom: any) {
		const { channelId } = chatroom;
		try {
		  const result = await this.prisma.userOnChannel.deleteMany({
			where: {
				AND: [
					{userId: userId},
					{channelId: channelId},
				]
			},
		  });
		  console.log("result ===", result);
		  return result;
		} catch (err) {
		  console.log(err);
		}
	  }

	async updatePassword(channelId: number, newPasswordHash: any): Promise<Chatroom> {
		// const chatroom = await this.prisma.chatroom.findOne({ where: { id: channelId } });
		const {password} = newPasswordHash;
		const newpassword =  await argon.hash(password)
	//hash argon
		const updatedChatroom = await this.prisma.chatroom.update({
		  where: { id: channelId },
		  data: { hash: newpassword},
		});
		console.log("updatedPassword", updatedChatroom)
		return updatedChatroom;
	  }

	  async kick(channelId: number, userId: number) {
		try {
			const userOnChannel = await this.prisma.userOnChannel.findFirst({
				where: {
					channelId: channelId,
					userId: userId,
				},
			});
	
			if (!userOnChannel) {
				throw new Error(`User with ID ${userId} is not a member of the channel with ID ${channelId}`);
			}
	
			const deletedUserOnChannel = await this.prisma.userOnChannel.delete({
				where: {
					id: userOnChannel.id,
				},
			});
	
			return `User with ID ${userId} has been kicked from channel with ID ${channelId}`;
		} catch (error) {
			console.error(error);
			throw new Error("Failed to kick user from channel.");
		}
	}	  
	
	async ban(channelId: number, userId: number) {
		try {
			console.log("entre dans le service ")
			const userOnChannel = await this.prisma.userOnChannel.findFirst({
				where: {
					channelId: channelId,
					userId: userId,
				},
			});

			console.log("USER ON CHANNEL", userOnChannel)
	
			if (!userOnChannel) {
				throw new Error(`User with ID ${userId} is not a member of the channel with ID ${channelId}`);
			}
	
			const updatedStatus = await this.prisma.userOnChannel.update({
				where: {
					channelId_userId: {
					  channelId,
					  userId,
					},
				  },
				data: {
					status: UserStatusOnChannel.BAN,
				},
			});
			console.log("UPDATED STATUS --->", updatedStatus)
			return `User with ID ${userId} has been banned from channel with ID ${channelId}`;
		} catch (error) {
			console.error(error);
			throw new Error("Failed to ban user from channel.");
		}
	}
	
	async unBan(channelId: number, userId: number) {
		try {
			console.log("entre dans le service ")
			const userOnChannel = await this.prisma.userOnChannel.findFirst({
				where: {
					channelId: channelId,
					userId: userId,
				},
			});

			console.log("USER ON CHANNEL", userOnChannel)
	
			if (!userOnChannel) {
				throw new Error(`User with ID ${userId} is not a member of the channel with ID ${channelId}`);
			}
	
			const updatedStatus = await this.prisma.userOnChannel.update({
				where: {
					channelId_userId: {
					  channelId,
					  userId,
					},
				  },
				data: {
					status: UserStatusOnChannel.CLEAN,
				},
			});
			console.log("UPDATED STATUS --->", updatedStatus)
			return `User with ID ${userId} has been unbanned from channel with ID ${channelId}`;
		} catch (error) {
			console.error(error);
			throw new Error("Failed to unban user from channel.");
		}
	}
	  
}

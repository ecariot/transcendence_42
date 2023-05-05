import React, { FormEvent, RefObject, useContext, useEffect, useRef, useState } from "react";
import Fetch from "../../../interfaces/Fetch";
import { RoomMessage, UserChat } from "../../../interfaces/iChat";
import useSocket from "../../../service/socket";
import AuthContext from "../../../store/AuthContext";
import Message2 from "../message/message";
import MessageReq from "../message/message.req";
import NavbarChannel from "./NavbarChannel";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import { Alert, Box, IconButton, Modal, Snackbar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ErrorModalPassword from "./ErrorModalPassword";
import '../../../style/UsersOnChannel.css'

export default function CurrentChannel(props: any) {
	const currentChatroom = props.currentChatroom;
	const authCtx = useContext(AuthContext);
	const currentId = parseInt(authCtx.userId);
	const [sendMessage, addListener] = useSocket();
	const [newMessage2, setNewMessage2] = useState<string>("");
	const [messages2, setMessages2] = useState<RoomMessage[]>([]);
	const scrollRef: RefObject<HTMLDivElement> = useRef(null);
	const [AMessageChat, setAMessageChat] = useState<RoomMessage | null>(null);
	const [isJoined, setIsJoined] = useState<boolean>(currentChatroom.participants.some((p: any)=> p.userId === parseInt(authCtx.userId)));
	
	
	const [showPopUp, setShowPopUp] = useState(true);
	
	const userJoined = currentChatroom.participants.some((p: any)=> p.userId === parseInt(authCtx.userId))
	const [isMuted, setIsMuted] = useState(false);
	const [isBanned, setIsBanned] = useState(false);

	const [showUserList, setShowUserList] = useState<boolean>(false);
	const [UsersList, setUsersList] = useState(null);
	const [showUsersOnChannel, setShowUsersOnChannel] = useState<boolean>(true);
	const [paperPlane, hidePaperPlane] = useState(null);


	useEffect(() => {
		const participant = currentChatroom.participants.find((p: any) => p.userId === parseInt(authCtx.userId));
		if (participant) {
		  setIsMuted(participant.status === 'MUTE');
		  setIsBanned(participant.status === 'BAN');
		}
	  }, [currentChatroom.participants, authCtx.userId]);
	  

	const getUser = (userId: number): UserChat | null => {
		const author = props.allUsers.find((user: any) => +user?.id === +userId);
		if (author !== undefined) { return (author) }
		return (null);
	};

	useEffect(() => {
		scrollRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages2]);

	useEffect(() => {
		AMessageChat && currentChatroom?.id === AMessageChat.chatroomId &&
			setMessages2(prev => {
				const isDuplicate = prev.some(message => (message.createdAt === AMessageChat.createdAt && message.content === AMessageChat.content));
				if (!isDuplicate) {
					return [...prev, AMessageChat];
				}
				return prev;
			});
		if (currentChatroom) {
			getMess();
		}
	}, [AMessageChat, currentChatroom])

	async function getMess() {
		try {
			if (currentChatroom) {
				const response = await Fetch.fetch(authCtx.token, "GET", `chat-mess\/room`, currentChatroom?.id);
				setMessages2(response);
				sendMessage("userRoom", {
					userId: +authCtx.userId,
					roomId: +currentChatroom.id,
				} as any)
			}
		} catch (err) {
			console.log(err);
		}
	};

	useEffect(() => {
		if (userJoined) {
			setIsJoined(true)
		} else {
			setIsJoined(false)
		}
	  }, [currentChatroom]);

	useEffect(() => {
		addListener("getMessageRoom", (data) => setAMessageChat({
			authorId: data.authorId,
			chatroomId: data.chatroomId,
			content: data.content,
			createdAt: new Date(Date.now()),
		}));
	}, []);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (currentChatroom.id) {
			const message2 = {
				authorId: currentId,
				content: newMessage2,
				chatroomId: currentChatroom.id,
			};
			sendMessage("sendMessageRoom", {
				authorId: currentId,
				chatroomId: +currentChatroom.id,
				content: newMessage2,
			} as any)
			try {
				const res = await MessageReq.postMess(authCtx, message2);
				setMessages2([...messages2, res]);
				setNewMessage2("");
			} catch (err) { console.log(err) }
		}
	}

	const handleFormSubmit = (e: FormEvent) => {
		e.preventDefault();
		setShowPopUp(true);
	};

	const handleLeaveChannel = () => {
		setIsJoined(false);
		props.setShowList(false);
		props.setUsersList(true);
		setShowUserList(true);
	};

	const handleDeleteChannel = () => {
		props.setShowList(false);
		props.setUsersList(true);
		setIsJoined(false);
	};

	
	useEffect(() => {
		addListener("showUsersList", data => setUsersList(data));
		if (!showUsersOnChannel) {
		  setShowUserList(true);
		}
	  }, [showUsersOnChannel]);
	  

	useEffect(() => {
		addListener("hidePaperPlane", data => hidePaperPlane(data));
	})


	return (
		<>
			{isJoined && !isBanned && (
				<>
					<NavbarChannel
						chatroom={currentChatroom}
						onCancel={() => setShowPopUp(false)}
						onClick={() => setShowPopUp(false)}
						onSubmit={handleFormSubmit}
						onLeaveChannel={handleLeaveChannel}
						onDeleteChannel={handleDeleteChannel}
					/>
					<div className="chatBoxTop">
						{messages2.length ? (
							messages2.map((m, i) => (
								<div key={i} ref={scrollRef}>
									<Message2 message2={m} user={getUser(m?.authorId)} authCtx={authCtx} own={m?.authorId === currentId} />
								</div>
							))
						) : (
							<div className="box-msg"><span className="noConversationText2">No message in this room yet.</span></div>
						)}
					</div>
					<div className="chatBoxBottom">
						<input
							className="chatMessageInput"
							placeholder="write something..."
							onChange={(e) => setNewMessage2(e.target.value)}
							value={newMessage2}
						></input>
						{!isMuted && 
							<FontAwesomeIcon
								icon={faPaperPlane}
								onClick={handleSubmit}
								className={`send-btn-chat`} // ajouter la classe 'muted' si l'utilisateur est mute							
								disabled={props.isMuted} // désactiver le bouton d'envoi si l'utilisateur est mute
							/>
						}
					</div>
				</>
			)}
			{showUsersOnChannel}

		</>
	);
	
}

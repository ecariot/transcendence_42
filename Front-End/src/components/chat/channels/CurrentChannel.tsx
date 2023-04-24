import React, { FormEvent, RefObject, useContext, useEffect, useRef, useState } from "react";
import Fetch from "../../../interfaces/Fetch";
import { RoomMessage, UserChat } from "../../../interfaces/iChat";
import useSocket from "../../../service/socket";
import AuthContext from "../../../store/AuthContext";
import Message2 from "../message/message";
import MessageReq from "../message/message.req";
import NavbarChannel from "./NavbarChannel";
import { Modal, Box, Typography, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import JoinChannelModal from "./JoinChannelModal";

export default function CurrentChannel(props: any) {
	const currentChatroom = props.currentChatroom;
	const authCtx = useContext(AuthContext);
	const currentId = parseInt(authCtx.userId);
	const [sendMessage, addListener] = useSocket();
	const [newMessage2, setNewMessage2] = useState<string>("");
	const [messages2, setMessages2] = useState<RoomMessage[]>([]);
	const scrollRef: RefObject<HTMLDivElement> = useRef(null);
	const [AMessageChat, setAMessageChat] = useState<RoomMessage | null>(null);
	const [isJoined, setIsJoined] = useState(false);
    const [openModal, setOpenModal] = useState(true);

	const getUser = (userId: number): UserChat | null => {
		const author = props.allUsers.find((user: any) => +user?.id === +userId);
		if (author !== undefined) { return (author) }
		return (null);
	};
	
	// console.log("ALL USERS", props.allUsers);
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
	async function checkIfJoined() {
		try {
			const response = await fetch (
				`http://localhost:3000/chatroom2/userTable/${currentId}/${currentChatroom.id}`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${authCtx.token}`
					}
				}
			)
			const data = await response.json();
			if (data.length > 0) {
				setIsJoined(true);
			} else {
				setIsJoined(false);
			}
		} catch (err) {
			console.log(err);
		}
	}
	
	

	useEffect(() => {
		checkIfJoined();
	  }, []);

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
	const [open, setOpen] = useState(false);
	
	return (
		<>
			{/* <div>chat in {currentChatroom.name} </div> */}
			<NavbarChannel chatroom={currentChatroom} />
			{isJoined && (
				<>
					<div className="chatBoxTop">
						{messages2.length?
							messages2.map((m) => (
								<div key={m?.createdAt instanceof Date ? m.createdAt.getTime() : m.createdAt} ref={scrollRef}>
									<Message2 message2={m} user={getUser(m?.authorId)} authCtx={authCtx} own={m?.authorId === currentId} />
								</div>
							)) : <span className="noConversationText2"> No message in this room yet. </span>
						}
					</div>
					<div className="chatBoxBottom">
						<textarea className="chatMessageInput" placeholder="write something..."
							onChange={(e) => setNewMessage2(e.target.value)} value={newMessage2}
						></textarea>
						<button className="chatSubmitButton" onClick={handleSubmit}> Send </button>
					</div>
				</>
			)}

			{!isJoined && (
				<p>you need to join the channel before talking into it</p>
			// <JoinChannelModal openModal={openModal} setOpenModal={setOpenModal}/>
			)}

		
		</>
	)
	
}

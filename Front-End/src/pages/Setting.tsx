import React, { FormEvent, useEffect, useRef, useState } from 'react';
import '../style/Settings.css'
import { Navigate } from "react-router-dom";
import AuthContext from '../store/AuthContext';
import { useContext } from "react";
import SideBar from '../components/auth/SideBar'
import style from '../style/Menu.module.css'
import { TextField } from '@mui/material';
import Switch2FA from '../components/settings/Switch2FA';
import ButtonSettings from '../components/settings/ButtonSettings';



const Setting = () => {
	const authCtx = useContext(AuthContext);
	const isLoggedIn = authCtx.isLoggedIn;
	const usernameInputRef = useRef<HTMLInputElement>(null);
	const [isTwoFAEnabled, setIsTwoFAEnabled] = useState(false);

	const handleSubmit = async (file: File) => {
		// Vous pouvez envoyer le fichier sélectionné au serveur ici
		const formData = new FormData();
		formData.append("file", file);
		try {
			const response = await fetch(`http://localhost:3000/users/upload`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${authCtx.token}`,
				},
				body: formData,
			})
			const data = await response.json();
			if (!response.ok) {
				console.log("POST error on ${userId}/username ");
				return "error";
			}
			authCtx.fetchAvatar(data.id);
			localStorage.setItem("avatar", data.avatar);
			return "success";
		} catch (error) {
			return console.log("error", error);
		}
	};

	const handleRestore = async (event: FormEvent) => {
		event.preventDefault();
		try {
			const response = await fetch(`http://localhost:3000/users/restore`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${authCtx.token}`,
				},
			})
			const data = await response.json();
			if (!response.ok) {
				console.log("POST error on /restore ");
				return "error";
			}
			authCtx.updateAvatar('');
			localStorage.setItem("avatar", "");
			return "success";
		} catch (error) {
			return console.log("error", error);
		}
	}

	const handleUsername = async (event: FormEvent) => {
		event.preventDefault();
		const newUsername = usernameInputRef.current!.value;
		const userId = authCtx.userId;
		try {
			const response = await fetch(`http://localhost:3000/users/${userId}/username`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${authCtx.token}`,
				},
				body: JSON.stringify({username: newUsername}),
			})
			await response.json();
			if (!response.ok) {
				console.log("POST error on ${userId}/username ");
				return "error";
			}
			localStorage.setItem("username", newUsername);
			return "success";
		} catch (error) {
			return console.log("error", error);
		}
	}

	const fetchIs2FA = async (token: string) => {
		try {
			const response = await fetch(`http://localhost:3000/auth/2fa`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (!response.ok) {
				return "error"
			}
			const data = await response.json()
			setIsTwoFAEnabled(data);
			return "success";
		} catch (error) {
			return console.log("error", error);
		}
	}

	useEffect(() => {
		fetchIs2FA(authCtx.token);
	}, [isTwoFAEnabled]);

	const handleSwitchChange = (isTwoFAEnabled: boolean) => {
		setIsTwoFAEnabled(isTwoFAEnabled)
	};

	return(
		<>
			<div className={style.mainPos}>
				<SideBar title="Settings" />
			<div className="contain-set">
				<div className="section">
					<h3>USERNAME</h3>
					<p>Your username has to be unique and at most 20 characters long</p>
					<div className="form-set">
						<TextField id="username" className="custom-field" label="Username" inputRef={usernameInputRef}  variant="filled" placeholder="Change your name..."/>
						<ButtonSettings onSubmit={handleUsername} title="Submit"></ButtonSettings>
					</div>
				</div>
				<div className="section">
					<h3>AVATAR</h3>
					<p>The image needs to be a .jpg file and can have a maximum size of 5MB</p>
					<div className="form-set">
						<ButtonSettings onSubmit={handleSubmit} title="Upload" component="label" htmlFor="fileInput"></ButtonSettings>
						<ButtonSettings onSubmit={handleRestore} title="Restore"></ButtonSettings>
					</div>
				</div>
				<div className="section">
					<h3>2FA</h3>
					<p>With 2 factor of authentification, an extra layer of security is added to your account to prevent someone from logging in, event if they have your passowrd. This extra security measure requires you to verify your identity using a randomized 6-digit code generated by the Google authentificator App to log in</p>
					<div className="form-set">
						<Switch2FA is2FAEnabled={isTwoFAEnabled} onTwoFAChange={handleSwitchChange} />
						<ButtonSettings is2FAEnabled={isTwoFAEnabled} title="2FA"></ButtonSettings>
					</div>
				</div>
			</div>
			</div>
			{!isLoggedIn && <Navigate to="/" replace={true} />}
		</>
	)

}
export default Setting;

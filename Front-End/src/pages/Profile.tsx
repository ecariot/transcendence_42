import '../style/Profile.css'
import React, { FormEvent, useContext, useEffect, useState } from 'react'
import { Navigate, useParams } from "react-router-dom";
import AuthContext from '../store/AuthContext';
import SideBar from '../components/SideBar';
import style from '../style/Menu.module.css'
import { FriendContext } from '../store/FriendshipContext';
import FriendsDemands from '../components/friends/FriendsDemands';
import ShowFriends from '../components/friends/ShowFriends';
import ProfileCard from '../components/user/ProfileCard';
import Card from '../components/utils/Card';

const Profile = () =>  {
	const authCtx = useContext(AuthContext);
	const friendCtx = useContext(FriendContext);
	const isLoggedIn = authCtx.isLoggedIn;


	return (
		<>
		<div className={style.mainPos}>
			<SideBar title="Profile" />
			<div className='container-profile'>
				<ProfileCard context={authCtx}></ProfileCard>
				<Card color='blue' title="My Level" icon="level" type="stats" height="270px" width="355px"></Card>
				<Card color='red' title="My Rank" icon="rank" type="stats" height="270px" width="355px"></Card>
				<Card color='green' title="My Friends" type="showFriends" friendCtx={friendCtx} authCtx={authCtx} height="auto"></Card>
				<div className='card-wrapper'>
					<Card color='yellow' title="Match History" type="match" width="100%"></Card>
				</div>

		{/* <div className='User'>
			<h2 className="title">Demands :</h2>
			<FriendsDemands token={authCtx.token} context={friendCtx}></FriendsDemands>
		</div> */}
					<FriendsDemands authCtx={authCtx} friendCtx={friendCtx} token={authCtx.token}/>

			</div>
			{!isLoggedIn && <Navigate to="/" replace={true} />}
		</div>
		</>
	)
}

export default Profile;

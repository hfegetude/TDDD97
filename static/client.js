//Public key= email
//Private key= token/email
var serverSocket;
var is_ws_op = false;
function load(){
	
	if ( ! ((localStorage.getItem("Token") =="null") && (localStorage.getItem("Email")=="null" ) ) ) {
		GetUser = new XMLHttpRequest;
		var hashedtok = localStorage.getItem("Email")+"/"+Sha256.hash(localStorage.getItem("Token") + "/" + localStorage.getItem("Email"));
		GetUser.open("GET", "/get_user_data_by_token/"+ hashedtok, true);
		GetUser.onreadystatechange =function(){
			if (GetUser.readyState == 4 ) {
				var response = JSON.parse(GetUser.responseText); 
				if(response.success){
					HomeTab();
					if(! is_ws_op){
						openws(localStorage.getItem("Email"));
					}
				}
				else{
					WelcomePage();
				}		
			}
			
		}
		GetUser.send();
	}
	else{
		WelcomePage();
	}
}
window.onload=load;
function WelcomePage(){
	ChangeCurrentWindow("WelcomePageLoad");
	document.getElementById("FormSignIn").onsubmit = function(){
		SignInButton();
		return false;
	}
}
function HomeTab(){ //Done
	ChangeCurrentWindow("HomeTabLoad");
	ExtraWindow.erase();
	GetUser = new XMLHttpRequest;
	var hashedtok = localStorage.getItem("Email")+"/"+Sha256.hash(localStorage.getItem("Token") + "/" + localStorage.getItem("Email"));
	GetUser.open("GET", "/get_user_data_by_token/" +hashedtok, true);
	GetUser.onreadystatechange =function(){
		if (GetUser.readyState == 4) {
			var userdata = JSON.parse(GetUser.responseText);
			if(userdata.success){
				document.getElementById("HomeTabNameSpace").innerHTML = userdata.data.firstname;
				document.getElementById("HomeTabFamNameSpace").innerHTML = userdata.data.familyname;
				document.getElementById("HomeTabCitySpace").innerHTML = userdata.data.city;
				document.getElementById("HomeTabCountrySpace").innerHTML =userdata.data.country;
				document.getElementById("HomeTabGenderSpace").innerHTML = userdata.data.gender;
				document.getElementById("HomeTabEmailSpace").innerHTML= userdata.data.email;
			}
			else{
				ExtraWindow.display("Wrong Token")
			}
		}
	}
	GetUser.send();
	RefreshHomeTab();
}
function AccountTab(){
	ChangeCurrentWindow("AccountTabLoad");
	ExtraWindow.erase();
}
function BrowseTab(){
	ChangeCurrentWindow("BrowseTabLoad");
	ExtraWindow.erase();
}

function SignUpButton(){ //Done
	var SignUpName = document.getElementById("SignUpName").value;
	var SignUpFamName = document.getElementById("SignUpFamName").value;
	var SignUpGender = document.getElementById("SignUpGender").value;
	var SignUpCity = document.getElementById("SignUpCity").value;
	var SignUpCountry = document.getElementById("SignUpCountry").value;
	var SignUpPass = document.getElementById("SignUpPass").value;
	var SignUpRPass = document.getElementById("SignUpRPass").value;
	var SignUpEmail= document.getElementById("SignUpEmail").value;
	var validData = 1;
	if( !SignUpName || !SignUpFamName || !SignUpPass || !SignUpCountry || !SignUpCity ){
		validData = 0;
	}
	if( !(SignUpEmail.indexOf("@")==SignUpEmail.lastIndexOf("@"))|| !(SignUpEmail.indexOf(".")==SignUpEmail.lastIndexOf(".")) || (SignUpEmail.length < 4) )  {
		validData = 0;
	}
	
	validData = validPass(SignUpRPass, SignUpPass);

	if(validData==0){
		ExtraWindow.display("Bad Data", "red");
	}
	else{
	
		var user_data = {email: SignUpEmail, password: SignUpPass, firstname: SignUpName, familyname: SignUpFamName, gender: SignUpGender, city: SignUpCity , country: SignUpCountry}
		var Post= new XMLHttpRequest();
      	var message="";
     	Post.open("POST", "/sign_up", true);

     	Post.onreadystatechange = function() {
       		if (Post.w == 4){
       			var response = JSON.parse(Post.responseText);
       			if(response.success){
       				ExtraWindow.display("Succes Adding User", "green")
       			}
       			else{
       				ExtraWindow.display("Email already in use", "yellow")
       			}
       		}	
       	}

     	Post.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
     	for (var fields in user_data) {
        	message=message+fields+"="+user_data[fields]+"&";
      	};
      	Post.send(message);	
	}
}

function validPass(Pass, RPass){
	var valid=1;
	if(!(Pass==RPass) || !(Pass.length>0) ){
		valid=0;
	}
	return valid;
}



function SignInButton(){ //Done
	var SignInEmail = document.getElementById("SignInEmail").value;
	var SignInPass = document.getElementById("SignInPass").value;
	var GetPet = new XMLHttpRequest();

    GetPet.open("GET", "/sign_in/" + SignInEmail + "/" +SignInPass, true);
    GetPet.onreadystatechange = function() {
        if (GetPet.readyState == 4 ) {
            var data = JSON.parse(GetPet.responseText);
            if(data.success){
            	localStorage.setItem("Token" , data.token);
            	localStorage.setItem("Email" , SignInEmail);
            	openws(SignInEmail);
            	HomeTab();
            }
        	else{
        		ExtraWindow.display("Bad user name or password", "red");
       		} 
       	}
    };
    GetPet.send();
}

function ChangeCurrentWindow(NewWindow){
	document.getElementById("MainBox").innerHTML=document.getElementById( NewWindow ).innerHTML ;
	if(!(NewWindow=="WelcomePageLoad")){
		document.getElementById("MenuBox").innerHTML=document.getElementById( "MenuBarLoad" ).innerHTML ;
	}
	else{
		if(document.getElementById("MenuBox")!=null){
			document.getElementById("MenuBox").innerHTML = "";
		}
	}
};

function LogOut(){
	Out = new XMLHttpRequest();
	var hashedtok = localStorage.getItem("Email")+"/"+Sha256.hash(localStorage.getItem("Token") + "/" + localStorage.getItem("Email"));
	Out.open("GET", "/sign_out/"+hashedtok , true);
	Out.onreadystatechange = function() {
        if (Out.readyState == 4 && Out.status == 200){
        	if( JSON.parse(Out.responseText).success ){
        		localStorage.setItem("Token" , null);
        		localStorage.setItem("Email" , null);
				ExtraWindow.erase();
				serverSocket.send("end");
				WelcomePage();
			}
			else{
        		ExtraWindow.display("Could not logout", "red");
        	}
		}
    }
	Out.send();
}

function ChangePassword(){
	var AccountTabOldPass = document.getElementById("AccountTabOldPass").value;
	var AccountTabNewPass = document.getElementById("AccountTabNewPass").value;
	var AccountTabNewRPass = document.getElementById("AccountTabNewRPass").value;
	if ( validPass(AccountTabNewRPass, AccountTabNewPass)==1 ){
		changePass = new XMLHttpRequest();
		changePass.open("POST", "/change_password", true);
		changePass.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		changePass.onreadystatechange = function (argument) {
			if (changePass.readyState==4 ){
				if(JSON.parse(changePass.responseText).success ){
					ExtraWindow.display("Change successfull", "green");
				}
				else{
					ExtraWindow.display("Your pass is wrong", "red")
				}
			}
			
		}
		changePass.send("private_key="+Sha256.hash(localStorage.getItem("Token") + "/" + localStorage.getItem("Email"))+
			"&public_key="+localStorage.getItem("Email")+"&old_password="+AccountTabOldPass+"&new_password="+AccountTabNewPass);
	}	
	else{
		ExtraWindow.display("Your passwords don't match", "red")
	}

}

function RefreshHomeTab(){
	var getMessages = new XMLHttpRequest();
	var hashedtok = localStorage.getItem("Email")+"/"+Sha256.hash(localStorage.getItem("Token") + "/" + localStorage.getItem("Email"));
	getMessages.open("GET", "/get_user_messages_by_token/"+hashedtok, true);
	getMessages.onreadystatechange = function(){
		if(getMessages.readyState==4 ){
			messages = JSON.parse(getMessages.responseText);
			if(messages.success){
				var DisplayedText = "";
				for(var i=0; i<messages.data.length ; i++){
					DisplayedText = DisplayedText+messages.data[i][0] + "<br>" + messages.data[i][1]+ "<br>";
				}
				document.getElementById("MessageWallWrittenSpot").innerHTML = DisplayedText;
				ExtraWindow.erase();
			}
		}
	}
	getMessages.send();
	
}

function RefreshBrowseTab(){
	var getMessages = new XMLHttpRequest();
	
	getMessages.open("GET", "/get_user_messages_by_email/"+document.getElementById("BrowseWhoEmail").value, true);
	getMessages.onreadystatechange = function(){
		if(getMessages.readyState==4 ){
			messages = JSON.parse(getMessages.responseText);
			if(messages.success){
				var DisplayedText = "";
				for(var i=0; i<messages.data.length ; i++){
					DisplayedText = DisplayedText+messages.data[i][0] + "<br>" + messages.data[i][1]+ "<br>";
				}

				document.getElementById("BrowseMessageWallWrittenSpot").innerHTML = DisplayedText;
				ExtraWindow.erase();
			}
		}
	}
	getMessages.send();
}
function WritteBrowseTab(){
	PostReq = new XMLHttpRequest();
	PostReq.open("POST", "/post_message", true);
	PostReq.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	PostReq.onreadystatechange = function(){
		if(PostReq.readyState ==4){
			if(JSON.parse(PostReq.responseText).success){
				RefreshBrowseTab();
				ExtraWindow.erase();
			}
			else{
				ExtraWindow.display("Couldn't write :(")
			}
		}
	}	
	PostReq.send("private_key="+Sha256.hash(localStorage.getItem("Token") + "/" + localStorage.getItem("Email"))+
			"&public_key="+localStorage.getItem("Email")+"&email="+document.getElementById("BrowseWhoEmail").value+
			"&message="+document.getElementById("BrowseTabUserText").value);
}

function WritteHomeTab(){
	PostReq = new XMLHttpRequest();
	PostReq.open("POST", "/post_message", true);
	PostReq.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	PostReq.onreadystatechange = function(){
		if(PostReq.readyState ==4){
			if(JSON.parse(PostReq.responseText).success){
				RefreshHomeTab();
				ExtraWindow.erase();
			}
			else{
				ExtraWindow.display("Couldn't write :(", "red")
			}
		}
	}	
	PostReq.send("private_key="+Sha256.hash(localStorage.getItem("Token") + "/" + localStorage.getItem("Email"))+
			"&public_key="+localStorage.getItem("Email")+"&email="+document.getElementById("HomeTabEmailSpace").innerHTML+
			"&message="+document.getElementById("HomeTabUserText").value);
}

var ExtraWindow ={
	display: function(Message , Color){
		document.getElementById("MessageBox").style.display = "block";
		document.getElementById("MessageBox").style.color=Color;
		document.getElementById("MessageBox").innerHTML=Message;

	},
	erase: function(){
		document.getElementById("MessageBox").style.display="none";
	}
}



function openws(email){
	serverSocket = new WebSocket("ws://127.0.0.1:5000/openws");
	serverSocket.onopen = function (event) {
	  	serverSocket.send(JSON.stringify(email)); 
	  	is_ws_op = true;
	  	console.log("ws opened");
	};

	serverSocket.onmessage=function(event) {
		serverSocket.send("end");
		localStorage.setItem("Token" , null);
		ExtraWindow.erase();
		WelcomePage();
	};

	serverSocket.onclose=function(event){
		is_ws_op= false;
		console.log("wtf");
	};
}	


function FetchUserData(){
	ExtraWindow.erase();
	email= document.getElementById("BrowseWhoEmail").value; 
	getPet = new XMLHttpRequest();
	getPet.open("GET", "/get_user_data_by_email/"+email , true);
	getPet.onreadystatechange = function(){
		if(getPet.readyState == 4){
			outdata = JSON.parse(getPet.responseText);
			if(outdata.success){
				document.getElementById("BrowseTabNameSpace").innerHTML = outdata.data.firstname;
				document.getElementById("BrowseTabFamNameSpace").innerHTML = outdata.data.familyname;
				document.getElementById("BrowseTabCitySpace").innerHTML = outdata.data.city;
				document.getElementById("BrowseTabCountrySpace").innerHTML = outdata.data.country;
				document.getElementById("BrowseTabGenderSpace").innerHTML = outdata.data.gender;
				document.getElementById("BrowseTabEmailSpace").innerHTML= outdata.data.email;
				RefreshBrowseTab();

			}
			else{
				ExtraWindow.display("No such user", "yellow");
			}
		}	
	}
	getPet.send();
}

//Drag & drop
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("data", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("data");

    PostReq = new XMLHttpRequest();
	PostReq.open("POST", "/post_message", true);
	PostReq.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	PostReq.onreadystatechange = function(){
		if(PostReq.readyState ==4){
			if(JSON.parse(PostReq.responseText).success){
				RefreshHomeTab();
				ExtraWindow.erase();
			}
			else{
				ExtraWindow.display("Couldn't write :(", "red")
			}
		}
	}	
	PostReq.send("private_key="+Sha256.hash(localStorage.getItem("Token") + "/" + localStorage.getItem("Email"))+
			"&public_key="+localStorage.getItem("Email")+"&email="+document.getElementById("HomeTabEmailSpace").innerHTML+
			"&message="+document.getElementById(data).innerHTML);
}

	

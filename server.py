from gevent.pywsgi import WSGIServer
from geventwebsocket.handler import WebSocketHandler
from flask import Flask, request, render_template, redirect
from flask.ext.bcrypt import Bcrypt
import database_helper
import hashlib 
import json

id_socket = {}

def serialize( user_data):
    return {"email" : user_data[0][0], "familyname" : user_data[0][2], "gender" : user_data[0][3] ,"city" : user_data[0][4] , "country" : user_data[0][5], "firstname": user_data[0][7]}
 
def is_private_key_valid(identifier, private_key):
    token = database_helper.get_user_by_email(identifier)[0][6]
    print "sent key: "+private_key
    print "stored key: "+hashlib.sha256(token + "/" +identifier).hexdigest()
    print "token: "+token
    if hashlib.sha256(token + "/" +identifier).hexdigest()==private_key :
        print token
        return token
    else:
        return 0

                

app = Flask(__name__)
app.debug = True

@app.route('/', methods=['GET'])
def send_client():
    return redirect("/static/client.html", code=302)

@app.before_request
def before_request():
    database_helper.connect_db()

@app.teardown_request
def teardown_request(exception):
    database_helper.close_db()

@app.route('/sign_up', methods=['POST'])
def sign_up():
    email = request.form['email']
    firstname = request.form['firstname']
    familyname = request.form['familyname']
    city = request.form['city']
    country = request.form['country']
    gender = request.form['gender']
    password = request.form['password']

    if(database_helper.user_exist(email)):
        return json.dumps({"message":"Email in use", "success": False}), 501
    else:
        result = database_helper.insert_user(email, firstname, familyname, city, country, gender, bcrypt.generate_password_hash(password))

    if result == True:
        return json.dumps({"message":"User added", "success": True}),  200
    else:
        return json.dumps({"message":"Failure adding user", "success": False}),  500

@app.route('/sign_in/<email>/<password>', methods=['GET'])
def sign_in(email=None, password=None):
    passh=database_helper.fetch_password(email)
    if bcrypt.check_password_hash(passh, password):
        token=database_helper.log_user(email)
        return json.dumps({"message":"Logged :D", "success":True, "token":token}), 200 
    else:
        return json.dumps({"message":"No such user", "success": False}), 400 
        

@app.route('/sign_out/<public_key>/<private_key>', methods=['GET'])
def sign_out(public_key ,private_key):
    token=is_private_key_valid(public_key, private_key)
    if token==0:
        return json.dumps({"message":"Failure loging out", "success": False}), 400 
    else:
        user=database_helper.get_user_by_token(token)
        if user==[]:
            return json.dumps({"message":"Failure loging out", "success": False}), 400 
        else:
            database_helper.log_out(token)
            return json.dumps({"message":"Success loging out", "success": True}), 200 

@app.route('/change_password', methods=['POST'])
def change_password():
    private_key=request.form['private_key']
    public_key=request.form['public_key']
    old_password=request.form['old_password']
    new_password=request.form['new_password']
    token=is_private_key_valid(public_key, private_key)
    if(token==0):
        return json.dumps({"message":"Bad token", "success": False}), 500
    else:
        user_data=database_helper.get_user_by_token(token)
        if bcrypt.check_password_hash(user_data[0][1], old_password):
            database_helper.update_password(bcrypt.generate_password_hash(new_password), token)
            return json.dumps({"message":"Success", "success": True}), 200
        else:
            return json.dumps({"message":"Wrong password", "success": False}), 500

@app.route('/get_user_data_by_token/<public_key>/<private_key>', methods=['GET'])
def get_user_data_by_token(public_key, private_key):
    token=is_private_key_valid(public_key, private_key)
    print token
    if token==0:
        return json.dumps({"message":"Failure loging out", "success": False}), 400 
    else:
        data=database_helper.get_user_by_token(token)
        if data==[]:
            return json.dumps({"message":"No such token in use", "success": False}) ,400
        else:
            return json.dumps({"message":"Data for you", "success": True ,"data" : serialize(data)}), 200

@app.route('/get_user_data_by_email/<email>', methods=['GET'])
def get_user_data_by_email(email):
    data=database_helper.get_user_by_email(email)
    if data==[]:
        return json.dumps({"message":"No such user", "success": False}), 400
    else:
        return json.dumps({"message":"Data 4 u", "success": True ,"data" : serialize(data)}), 200

@app.route('/post_message', methods=['POST'])
def post_message():
    private_key=request.form['private_key']
    public_key=request.form['public_key']
    email=request.form['email']
    message=request.form['message']
    token = is_private_key_valid(public_key, private_key)
    if(token==0):
        return json.dumps({"message":"Bad token", "success": False}), 500
    else:
        poster = database_helper.get_user_by_token(token)
        if poster==[]:
            return json.dumps({"message":"No valid token", "success": False}), 500
        else:
            if database_helper.get_user_by_email(email)==[]:
                return json.dumps({"message":"No such user", "success": False}), 400
            else:
                database_helper.post_message(message, email, poster[0][0])
                return json.dumps({"message":"Message posted", "success": True}), 200

@app.route('/get_user_messages_by_email/<email>' , methods=['GET'])
def get_user_messages_by_email(email):
    if database_helper.get_user_by_email(email)==[]:
        return json.dumps({"message":"No such user", "success": False}), 400
    else:
        return json.dumps({"message":"messages succesfully retrieved", "success": True , "data": database_helper.get_user_messages_by_email(email)})

@app.route('/get_user_messages_by_token/<public_key>/<private_key>' , methods=['GET'])
def get_user_messages_by_token(public_key, private_key):
    token=is_private_key_valid(public_key, private_key)
    if token==0:
        return json.dumps({"message":"Bad token", "success": False}), 400 
    else:
        data=database_helper.get_user_by_token(token)
        if data ==[]:
            return json.dumps({"message":"No such user", "success": False}), 500
        else:
            return  json.dumps({"message":"messages succesfully retrieved", "success": True , "data": database_helper.get_user_messages_by_email(data[0][0])}) , 200



@app.route('/openws')
def openws():
    if request.environ.get('wsgi.websocket'):
        ws = request.environ['wsgi.websocket']

        connection_data = ws.receive()
        connection_id = json.loads(connection_data)
        email = connection_id

        print("connection_data: "+str(connection_data))

        if not id_socket.has_key(str(email)):
            id_socket[str(email)] = ws
            print("socket: " + str(id_socket[str(email)]))
        else:
            id_socket[str(email)].send("gtfo")
            id_socket[str(email)].close()
            id_socket[str(email)] = ws
        # Active wait and listen on the socket
        while True:
            print("Waiting")
            try:
                msg = ws.receive()
                if msg == "end":
                    print('id_socket closing : ' + str(email) )
                    del id_socket[str(email)]
                    ws.close()
                    print('Websocket connection ended')
                    return json.dumps({'success': True, 'message': 'Websocket connection ended', 'data': ''})
            except:
                #if msg receive fails
                print('id_socket closing : ' + str(email) )
                del id_socket[str(email)]
                return json.dumps({'success': True, 'message': 'Websocket connection ended', 'data': ''})
            
            



if __name__ == '__main__':
    port = 5000
    print "Running WGSI server on port: "+ str(port)+"\n" 
    bcrypt = Bcrypt(app)
    server = WSGIServer(('', port), app, handler_class=WebSocketHandler)
    server.serve_forever()


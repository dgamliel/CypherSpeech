from flask import Flask, render_template, url_for
import socketio         
#import eventlet         

"""
Flask    - Webapp framework
socketio - Web sockets to be used from browsers
eventlet - Uses async polling for client matching
"""
sio = socketio.Server()
app = Flask(__name__)


@app.route('/')
def hello_world():
    return render_template("index.html")

@sio.event
def connect(sid):
    print(sid, "connected")

from flask import Flask, render_template 
#import socketio         
#import eventlet         

"""
Flask    - Webapp framework
socketio - Web sockets to be used from browsers
eventlet - Uses async polling for client matching
"""

app = Flask(__name__)

@app.route('/')
def hello_world():
    return render_template("index.html")


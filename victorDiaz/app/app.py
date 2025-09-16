from os import name
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')

def formulario():
    return render_template('index.html', name = 'Flask') #renderiza el archivo html.

if __name__ == '__main__':
    app.run(debug=True)

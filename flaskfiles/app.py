# import dependences
from flask import Flask, request, render_template,jsonify
import json
import pymongo

######################################
#pymongo setup 

conn = 'mongodb://localhost:27017'
client = pymongo.MongoClient(conn)

#connect database
db = client.visualizing_sep

# entries_collection = db.all_entries
entries_collection = db.all_entries_updated

######################################
#get sep network from json
with open('static/sep_network.json', encoding='UTF-8') as json_file:
    sep_network = json.load(json_file)

# get list of all philosophers, and then add node at beginning to indicate its a list of philosophers
list_philosopher = [node['title'] for node 
                        in sep_network['nodes'] 
                        if node['entry_type'] == 'thinker']
list_philosopher.insert(0,'&#10218;Search Philosophers...&#10219;')

# get list of all concepts, and then add node at beginning to indicate its a list of concepts
list_concepts = [node['title'] for node 
                        in sep_network['nodes'] 
                        if node['entry_type'] != 'thinker']   
list_concepts.insert(0,'&#10218;Search Ideas...&#10219;')



######################################
#start flask application code 
app= Flask(__name__)

#setup homepage
@app.route('/')
def index():
    return render_template('index.html', 
                            philosophers=list_philosopher,
                            ideas=list_concepts)

@app.route('/GET-DATA/')
def get_data():
    return jsonify(sep_network)
    



#run app
if __name__ == "__main__":
    app.run(debug=True)
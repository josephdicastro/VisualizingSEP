import json
from pprint import pprint

with open('static/sep_network.json') as json_file:
    json_data = json.load(json_file)
pprint(json_data)
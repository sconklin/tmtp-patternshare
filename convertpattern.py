#!/usr/bin/python
# -*- coding: utf-8 -*-

import simplejson as json
from sys                                import stdout, argv, exit
from os                                 import path
import collections

# load_jsonfile
#
def load_jsonfile(file_name):
    """
    Load the json data file.
    """
    retval = None

    if file_name[0] == '/' or file_name[0] == '.':
        # The full path is specified. Use the name as is.
        #
        fid = file_name
    else:
        # Find it ...
        #
        fid = file_name
        if not path.exists(fid): # Current directory
            fid = path.join(path.dirname(argv[0]), file_name)
            if not path.exists(fid):
                fid = None

    if fid is not None:
        with open(fid, 'r') as f:
            retval = json.load(f, object_pairs_hook=collections.OrderedDict)
    else:
        print("Error: Failed to find the json file.")
    return retval


if len(argv) < 2:
    print "Supply a JSON measurements filename"
    exit()

# Load the old pattern
data = load_jsonfile(argv[1])

# Convert the points to the new format
#{ "type" : "formula",  "name" : "seamAllowance", "formula" : "(5/8)*pt.IN"},
#{ "type" : "point_xy", "name" : "backNape", "x": "4*pt.seamAllowance", "y": "2*(1*meas.back_neck_balance - 1*meas.back_waist_length)"},
#{ "type" : "object",   "name" : "backHighbustCenter", "object" : "down(pt.backNape, 1*meas.back_highbust_height)"},

methods = ['intersectCircles', 'onCircleAtX', 'onCircleAtY', 'copy', 'onLineAtLength', 'onLineAtX', \
               'intersectVectorLine', 'intersectLineCircle', 'intersectLines', 'rotate', 'polar']

newpoints = []
dpp = data['pattern']['points']
for point in dpp:
    pdict = collections.OrderedDict()
    inp = dpp[point]
    #print inp
    try:
        xvar = inp['x']
        yvar = inp['y']
        pdict['type'] = 'point_xy'
        pdict['name'] = point
        pdict['x'] = xvar
        pdict['y'] = yvar
        newpoints.append(pdict)
    except:
        mname = inp.split('(')[0]
        if mname in methods:
            pdict['type'] = 'object'
            pdict['name'] = point
            pdict['object'] = inp
            newpoints.append(pdict)
        else:
            pdict['type'] = 'formula'
            pdict['name'] = point
            pdict['formula'] = inp
            newpoints.append(pdict)

data['pattern']['points'] = newpoints

# and dump the new pattern
print json.dumps(data, sort_keys=False, indent=4)

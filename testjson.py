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

data = load_jsonfile(argv[1])
print json.dumps(data, sort_keys=False, indent=4)
#for point in data['pattern']['points']:
#    print data

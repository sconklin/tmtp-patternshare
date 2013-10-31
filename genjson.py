#!/usr/bin/python
# -*- coding: utf-8 -*-

import json
from sys                                import stdout, argv, exit
from os                                 import path

# now create a dictionary that we'll output as json
outdata = {}
points = []

pd = { "type" : "formula", "name" : "CM" , "formula" : "convertUnit(1, 'cm', window.measurementData.clientdata.units)"}
points.append(pd)
pd = { "type" : "formula", "name" : "IN" , "formula" : "convertUnit(1, 'in', window.measurementData.clientdata.units)"}
points.append(pd)
pd = { "type" : "formula", "name" : "seamAllowance", "formula" : "(5/8)*pt.IN"}
points.append(pd)

pd =  { "type" : "point_xy", "name" : "backNape", "x": "4*pt.seamAllowance", "y": "2*(1*meas.back_neck_balance - 1*meas.back_waist_length)"}
points.append(pd)
pd =  { "type" : "object", "name" : "backHighbustCenter", "object" : "down(pt.backNape, 1*meas.back_highbust_height)"}
points.append(pd)
pd =  { "type" : "object", "name" : "backAcrossCenter", "object" : "down(pt.backNape, 0.66*dist(pt.backNape, pt.backHighbustCenter))"}
points.append(pd)
pd =  { "type" : "object", "name" : "backBustCenter", "object" : "down(pt.backNape, 1*meas.back_bust_height)"}
points.append(pd)


outdata['points'] = points
#print outdata
print json.dumps(outdata, sort_keys=True, indent=4)


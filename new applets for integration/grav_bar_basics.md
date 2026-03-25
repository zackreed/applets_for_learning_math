# Gravity Between Bar and Point Mass Applet

## Overview

The following is the GeoGebra variables instantiated for an applet that teaches students how to think locally about measuring gravity between a point mass and a rod aligned with it. These values are just the instantiations in the current state. Check the screenshot for what the applet looks like. 

I want you to recreate this applet but purely in html, just like the other applets in this repo. Make improvements as you see fit. Keep the color scheme and interactions compliant with accessibility needs

## GeoGebra Code

No.	Name	Value	Definition	Caption
1	Number segmentheight	segmentheight = 0.11	 	 
2	Number N	N = 4	 	 
3	Point bar1right	bar1right = (7, 0)	 	 
4	Point bar1left	bar1left = (0, 0)	 	 
5	Number dr	dr = 7 / 4	(x(bar1right) - x(bar1left)) / N	 
6	Point pointmass	pointmass = (-4, 0)	 	 
7	Segment f	f = 7	Segment(bar1left, bar1right)	 
8	List l1	l1 = {(0, 0.05), (1.75, 0.05), (3.5, 0.05), (5.25, 0.05), (7, 0.05)}	Sequence((k dr, segmentheight / 2), k, 0, N)	 
9	Number tracker	tracker = 1	 	 
10	Point corner1	corner1 = (-6.06, -0.42)	Corner(1)	 
11	Point corner3	corner3 = (0.41, 0.61)	Corner(3)	 
12	Number windowhegiht	windowhegiht = 1.03	y(corner3) - y(corner1)	 
13	Number windowwidth	windowwidth = 6.47	x(corner3) - x(corner1)	 
14	Point A	A = (0, 0.05)	l1(tracker)	 
15	Segment g	g = 4	Segment(pointmass + (0, 0.7segmentheight), A + (0, 0.2segmentheight))	 
16	Point B	B = (-2, 0.07)	Midpoint(g)	 
17	Number distance	distance = 4	Length(g)	 
18	Text text1	"D=4"	"D=" + (FormulaText(distance)) + ""	 
19	Segment h	h = 1.75	Segment((x(l1(tracker)), 0), (x(l1(tracker + 1)), 0))	 
20	Point C	C = (0.88, 0)	Midpoint(h)	 
21	Number L	L = 7	Length(f)	 
22	Number M	M = 10	 	 
23	Number density	density = 10 / 7	M / L	 
24	Number segmentmass	segmentmass = 2.5	density dr	 
25	Text text2	"\text{Mass}=2.5"	"\text{Mass}=" + (FormulaText(segmentmass)) + ""	 
26	Number pointmassmass	pointmassmass = 6	 	 
27	Number squaredistance	squaredistance = 16	distance²	 
28	Text text5	"\text{Point Mass}=6"	"\text{Point Mass}=" + (FormulaText(pointmassmass)) + ""	 
29	Text text6	"\text{Length}=7\\ \text{Mass}=10"	"\text{Length}=" + (FormulaText(L)) + "\\
\text{Mass}=" + (FormulaText(M)) + ""	 
30	Text text3	"\text{Sample Mass}=2.5"	"\text{Sample Mass}=" + (FormulaText(segmentmass)) + ""	 
31	Text text7	"\text{Sample Distance}=4"	"\text{Sample Distance}=" + (FormulaText(distance)) + ""	 
32	Text text8	"\text{Sample Mass}"	 	 
33	Text text9	"\text{Point Mass}"	 	 
34	Text text10	"D"	 	 
35	Text text4	"\text{Sample Force}=\frac{G\cdot \text{Sample Mass}\cdot \text{Point Mass}}{D^2}=\frac{G\cdot2.5\cdot 6}{16}"	"\text{Sample Force}=\frac{G\cdot \text{Sample Mass}\cdot \text{Point Mass}}{D^2}=\frac{G\cdot" + (FormulaText(segmentmass)) + "\cdot " + (FormulaText(pointmassmass)) + "}{" + (FormulaText(squaredistance)) + "}"	 
Created with GeoGebra
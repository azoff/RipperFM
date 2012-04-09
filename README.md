RipperFM
========
Rip songs from turntable.fm

Dependencies
------------
nodejs and id3tool

To Run
-------
Start the server:
```sh
node src/server.js
```
Then run the bookmarklet when you are in a turntable.fm room. 
Hover over the marquee and you'll see an option to download the
song. Click it, and the server will download the stream into
a project-relative downloads folder. 

Known issues
------------
iTunes is choking on the mp3s even though they play in Finder.
My guess is it doesn't like the mp3 format. Suggestions welcome.

License
-------
Do whatever you want with it, use it at your own risk.
You should probably buy your own music.
var mysql = require('mysql')
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var lp = require('link-preview-js');

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname));


// Define our db creds
var db = mysql.createConnection({
    host: 'ingordonupdb.mysql.db',
    user: 'ingordonupdb',
    database: 'ingordonupdb',
    password: 'Polacco1'
})
 
// Log any errors connected to the db
db.connect(function(err){
    if (err) console.log(err)
})
 
// Define/initialize our global vars
var feed = []
var isInitFeed = false
var socketCount = 0



 
io.on('connection', function(socket){
    // Socket has connected, increase socket count
    socketCount++
    // Let all sockets know how many are connected
    io.sockets.emit('users connected', socketCount)
 
    socket.on('disconnect', function() {
        // Decrease the socket count on a disconnect, emit
        socketCount--
        io.sockets.emit('users connected', socketCount)
    })

    socket.on('addElement', function(url){
        console.log('sono stato chiamato');
        lp.getLinkPreview(url).then((res) => {
            data = {
                url: res.url,
                titolo: res.title,
                descrizione: res.description,
                image: res.images[0],
            }

            console.log(data);
            // New note added, push to all sockets and insert into db
            feed.push(data);

            io.emit('addElement', data);
            // Use node's db injection format to filter incoming data
            db.query("INSERT INTO feed (titolo, url, descrizione, image) VALUES (?, ?, ?, ?)", [data.titolo, data.url, data.descrizione, data.image]);
        })
    })
 
    //Check to see if initial query/notes are set
    if (! isInitFeed) {
        // Initial app start, run db query
        db.query('SELECT * FROM feed')
            .on('result', function(data){
                // Push results onto the notes array
                feed.push(data)
            })
            .on('end', function(){
                // Only emit notes after query has been completed
                console.log('ho eseguito la query all\'avvio del server');
                socket.emit('initial feed', feed)
            })
 
        isInitFeed = true
    } else {
        // Initial notes already exist, send out
        socket.emit('initial feed', feed)
    }
})

let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let port = 3000;

app.use(express.static('public'));

io.on('connection', function(socket) {
  console.log("a user connected:", socket.id);

  // 客户端传来 mouth image
  socket.on("mouth", function(data) {
    // data = { id: socket.id, img: base64string }
    // 广播给所有人（包括自己）
    io.emit("mouth", data);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
    // 通知前端删除该用户的嘴
    io.emit("remove", socket.id);
  });
});

http.listen(port, function() {
  console.log("listening on *:" + port);
});

const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI);

const ExerciseUser = mongoose.model('ExerciseUser', {
  username: {type: String, required: true},
  exercises: [{
    description: {type: String, required: true},
    duration: {type: Number, required: true},
    date: {type: String, required: true},
  }]
});

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', bodyParser.urlencoded({extended:false}), (req, res)=>{
  ExerciseUser.create({username: req.body.username}, (err,user)=>{
      if(err) return res.send(err);
      res.json({
        username: user.username,
        _id:user._id
      })
  })
});

app.get('/api/users', (req, res)=>{
  ExerciseUser.find({},(err,data)=>{
    if(err) return res.send(err);
    res.json(data.map(user=>{return{
      username: user.username,
      _id: user._id
    }}));
  })
});

app.post('/api/users/:_id/exercises', bodyParser.urlencoded({extended:false}), (req, res)=>{

  ExerciseUser.findByIdAndUpdate(req.params._id,{$push: {exercises:{
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date? new Date(req.body.date).toDateString(): new Date().toDateString()
    }}},{new: true, upsert:true}, (err)=>{
    
      if(err) return res.send(err);

      ExerciseUser.findById(req.params._id,(err, user)=>{
        if(err) return console.log(err);
        res.json({
          username: user.username,
          description: user.exercises[user.exercises.length - 1].description,
          duration: user.exercises[user.exercises.length - 1].duration,
          date: user.exercises[user.exercises.length - 1].date,
          _id: user._id
        });
      });
    
  });


  
});

app.get('/api/users/:_id/logs', (req,res)=>{
  let log;
  
  ExerciseUser.findOne({_id: req.params._id}, (err,user)=>{
    if(err) return res.send(err);
    
    log = user.exercises;
    console.log(log);
    
    if(req.query.from){
      console.log('from date is ' + req.query.from);
      log = log.filter(exc=> new Date(exc.date).getTime() >= new Date(req.query.from).getTime());
      console.log(log);
    }

    if(req.query.to){
      console.log('to date is ' + req.query.to);
      log =log.filter(exc=> new Date(exc.date).getTime() <= new Date(req.query.to).getTime());
    }

    if(req.query.limit && !isNaN(req.query.limit)){
      console.log('limit is ' + req.query.limit);
      log = log.splice(0,0+parseInt(req.query.limit));
    }

    res.json({
        username: user.username,
        count: log.length,
        _id: user._id,
        log: log.map(exc=>{
          return {
            description: exc.description,
            duration: exc.duration,
            date: exc.date,
          }
        })
    });
    
  })
  
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

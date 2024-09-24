
const express = require('express')
const app = express()
                    // MOngoDB의 ObjectId 클래스를 가져오는 구문
const {MongoClient, ObjectId} = require('mongodb');
const methodOverride = require('method-override')

app.use(methodOverride('_method'))
app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true})) 


let db;
let write;
const url = 'mongodb+srv://admin:qwer1234@jw.geqh7.mongodb.net/?retryWrites=true&w=majority&appName=jw'
new MongoClient(url).connect().then((client)=>{
  console.log('DB연결성공')
  db = client.db('forum')
  write = client.db('write')
  app.listen(8080, ()=>{
    console.log('http://localhost:8080 에서 서버 실행 중')
  })
}).catch((err)=>{
  console.log(err)
})

app.get('/', (요청, 응답)=>{
    응답.sendFile(__dirname + '/index.html')
})
app.get('/news', (요청, 응답)=>{
    // db.collection('post').insertOne({title : '어쩌구'})
    응답.send('오늘 비옴')
})

app.get('/list', async(요청, 응답)=>{
    let result = await db.collection('post').find().toArray()
    응답.render('list.ejs', {posts : result})
})
app.get('/time', (요청, 응답)=>{

    응답.render('time.ejs', {data : new Date()})
})

app.get('/write', (요청, 응답)=>{

    응답.render('write.ejs', {data : new Date()})
})

// 리스트 항목 추가
app.post('/add', async(요청, 응답)=>{
  console.log(요청.body)

  try{
    if(요청.body.title == '' || 요청.body.content==''){
      if(요청.body.title == ''){
        응답.send('제목 입력 안했는데?')
  
      }else if(요청.body.content == ''){
        응답.send('내용 입력 안했는데?')
      }
      
    }else{
      // 새로운 ObjectId 생성
      let newPostId = new ObjectId();
      console.log('newPostId: ', newPostId)
      await db.collection('post').insertOne({_id :newPostId, title : 요청.body.title, content : 요청.body.content})
      응답.redirect('/list')
    }
  }catch(e){
    console.log(e) // 에러 메시지 출력해줌
    응답.status(500).send('서버 에러 남')

  }
}) 
// app.post('/add', (요청, 응답)=>{
//   console.log(요청.body)
//   write.collection('content').insertOne({_id : 1, title : 요청.body.title, content : 요청.body.content})
// }) 

  //  서버는 글을 검사

app.get('/detail/:id', async(요청, 응답)=>{
  try{
    // 요청.params.aaaa를 사용하여 _id를 가져옵니다.
    let result = await db.collection('post').findOne({_id : new ObjectId(요청.params.id)}) // 이 데이터 가진 document 1개 찾아옴 
    console.log('result : ', result); 

    if (result){
      // ejs 템플릿에 데이터 전달
      응답.render('detail.ejs', {title : result.title, content:result.content})
    }else{
      응답.status(404).send('Document not found');
    }

    if (result == null){
      응답.status(400).send('이상한 url 입력함')
    }
  }catch(error){
    console.log(error);
    응답.status(500).send(`Internal Server Error 
      이상한 url 입력함`); // 5xx : 서버문제, 4xx : 유저문제
  }
  

  console.log(요청.params.id);  // 유저가 URL 파라미터 자리에 입력한 데이터 출력 
  
})

app.get('/edit/:id', async (요청, 응답)=>{
  let result = await db.collection('post').findOne({_id : new ObjectId(요청.params.id)})
  console.log(result);
  응답.render('edit.ejs', {result : result})
})

app.post('/edit', async (요청, 응답)=>{
    await db.collection('post').updateOne({_id : new ObjectId(요청.body.id)},
    {$set : {title: 요청.body.title, content : 요청.body.content}})
//   await db.collection('post').updateMany({like :{$gte : 10}}, 
//   {$inc : {like : 1}})

  응답.redirect('/list'); // 수정 후 리다이렉트
})

app.post('/delete/:id', async (요청, 응답)=>{
    try {
        let postId = new ObjectId(요청.params.id);

        console.log('postId :', postId)

        const result = await db.collection('post').deleteOne({_id: postId});
        if (result.deletedCount === 1) {
            console.log('Successfully deleted one document.');
            응답.status(200).json({ message: 'Successfully deleted' });
        } else {
            console.log('No documents matched the query. Deleted 0 documents.');
            응답.status(404).json({ message: 'No document found' });
        }
    } catch(error){
        console.error('INvaild ObjectId:', error);
        응답.status(400).send('Invalid ID format');
    }
  
})

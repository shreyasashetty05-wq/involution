const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0';
const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(shorts\/)|(watch\?))\??v?=?([^#&?]*).*/;
const match = url.match(regExp);
console.log(match ? match[8] : 'null');

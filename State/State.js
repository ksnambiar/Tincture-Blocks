const {tincture} = require("../inits/init");

class state{
  constructor(){
    this.data={
      songs=[]
    }
  }
  addSong =function(songData){
    this.data.songs.push(songData)
  }
  getSongByName=function(name){
    this.data.songs.forEach(obj=>{
      if(obj.name===name){
        return obj
      }
    })
    return 0
  }
  getSongById = function(id){
    this.data.songs.forEach(obj=>{
      if(obj.id===id){
        return obj
      }
    })
    return 0;
  }
  getSongs = function(){
    return this.data.songs;
  }
}

module.exports={state}

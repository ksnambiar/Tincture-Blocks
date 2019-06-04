const {tincture} = require("../inits/init");

class state{
  constructor(){
    this.data={
      songs:[]
    }
  }
  addSong(songData){
    this.data.songs.push(songData)
  }
  getSongByName(name){
    this.data.songs.forEach(obj=>{
      if(obj.name===name){
        return obj
      }
    })
    return 0
  }
  getSongById(id){
    this.data.songs.forEach(obj=>{
      if(obj.id===id){
        return obj
      }
    })
    return 0;
  }
  getSongs(){
    return this.data.songs;
  }
}

module.exports={state}

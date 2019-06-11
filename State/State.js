const {tincture} = require("../inits/init");

class state{
  constructor(){
    this.data={
      songs:[],
      trending:[],
      mt:[]
    }
  }
  addToTrending(data){
    this.data.trending.push(data)
  }
  addToMt(data){
    this.data.mt.push(data)
  }
  addSong(songData){
    this.data.songs.push(songData)
  }
  reloadState(state){
    this.data.songs=state
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

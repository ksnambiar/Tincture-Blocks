
class state{
  constructor(){
    this.data={
      songs=[]
    }
  }
  addSong =function(songData){
    this.data.songs.push(songData)
  }

}

module.exports={state}

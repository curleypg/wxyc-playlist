const main = async () => {
  const playlist = Vue.createApp({
    data() {
      return {}
    },
    template: '<AppComponent livePlaylist="true" />'
  })
  playlist.component('AppComponent', AppComponent)
  playlist.component('InputComponent', InputComponent)
  playlist.component('RowComponent', RowComponent)
  playlist.component('PlaycutComponent', PlaycutComponent)
  playlist.mount('#playlist')

  const saved = Vue.createApp({
    data() {
      return {}
    },
    template: '<AppComponent livePlaylist="false" />'
  })
  saved.component('AppComponent', AppComponent)
  saved.component('InputComponent', InputComponent)
  saved.component('RowComponent', RowComponent)
  saved.component('PlaycutComponent', PlaycutComponent)
  saved.mount('#saved')
}

const fetchPlaylist = async (n = 5) => fetch(`https://philipcurley.me:8893/playlists/recentEntries?v=2&n=${n}`)
.then(res => res.json())
.then(data => data)

const fetchNewPlaylistData = async () => {
  let update = await fetchPlaylist()
  let data = transformPlaylistData(update)

  return data
}

const addNewRows = (current, update) => {
  let playCutsIds = current.map(c => c.id)

  // Unique tracks only.
  return update.filter(c => playCutsIds.includes(c.id) === false)
}

const transformPlaylistData = (data) => {
  let collect = data.playcuts.map(d => {
    d.type = 'playcut'
    return d
  })

  collect = collect.concat(data.breakpoints.map(d => {
    d.type = 'breakpoint'
    return d
  }))

  collect = collect.concat(data.talksets.map(d => {
    d.type = 'talkset'
    return d
  }))

  collect.sort(chronSort)

  return collect
}

const chronSort = (a,b) => b.chronOrderID - a.chronOrderID

const setUpLocalStorage = () => {
  let items = window.localStorage.getItem('wxyc-playlist')

  if (items === null) {
    window.localStorage.setItem('wxyc-playlist', JSON.stringify([]))
  }
}

const saveObject = item => {
  let store = JSON.parse(window.localStorage.getItem('wxyc-playlist'))

  let storeCheck = store.filter(s => s.id === item.id)

  if (storeCheck.length === 0) {
    store.push(item)
  }

  window.localStorage.setItem('wxyc-playlist', JSON.stringify(store.sort(chronSort)))
}

const deleteObject = id => {
  let pos = -1
  let store = JSON.parse(window.localStorage.getItem('wxyc-playlist'))

  store.every((item, index) => {
    if (item.id === id) {
      pos = index
      return false
    }

    return true
  })

  if (pos > -1) {
    store.splice(pos, 1)
  }

  window.localStorage.setItem('wxyc-playlist', JSON.stringify(store))
}

const checkObject = id => {
  let exists = false
  let store = JSON.parse(window.localStorage.getItem('wxyc-playlist'))

  store.every(item => {
    if (item.id === id) {
      exists = true
      return false
    }

    return true
  })

  return exists
}

const InputComponent = {
  props: {
    artistName: String,
    chronOrderID: Number,
    id: Number,
    labelName: String,
    releaseTitle: String,
    request: String,
    rotation: String,
    songTitle: String,
    type: String
  },
  data() {
    return {
      checked: checkObject(this.id),
      inputId: 'save-' + this.id
    }
  },
  methods: {
    change (event) {
      if (event.target.checked === true) {
        saveObject({
          artistName: this.artistName,
          chronOrderID: this.chronOrderID,
          id: this.id,
          labelName: this.labelName,
          releaseTitle: this.releaseTitle,
          request: this.request,
          rotation: this.rotation,
          songTitle: this.songTitle,
          type: this.type
        })
      }
      else {
        deleteObject(this.id)
      }
    }
  },
  template: `
    <label :for="inputId">
      <span class="sr-only">Save track {{ releaseTitle }} to your collection</span>
      <input @change="change" type="checkbox" :checked="checked" :id="inputId">
    </label>`
}

const AppComponent = {
  props: {
    livePlaylist: String
  },
  data() {
    return {
      loading: true,
      items: []
    }
  },
  async created() {
    if (this.livePlaylist === 'true') {
      data = await fetchPlaylist(100)
      this.items = transformPlaylistData(data)
      this.loading = false
      this.update()
    } else {
      data = JSON.parse(window.localStorage.getItem('wxyc-playlist'))
      this.items = data.sort((a,b) => b.chronOrderID - a.chronOrderID)
      this.loading = false
    }
  },
  methods: {
    async update() {
      const self = this
      setInterval(async () => {
        try {
          let newData = await fetchNewPlaylistData(15)
          let newRows = addNewRows(self.items, newData)
  
          newRows.forEach(d => {
            self.items.splice(0, 0, d)
            self.items.sort(chronSort)
          })
        } catch (error) {
          console.error(error)
        }
      }, 60000)
    }
  },
  template: `<p v-if="loading">Loading...</p>
  <div class="table" v-else>
    <div class="row head">
      <div class="save">Save</div>
      <div class="rotation">WXYC Playlist</div>
      <div class="artist">Artist</div>
      <div class="song">Song</div>
      <div class="release">Release</div>
      <div class="label">Label</div>
      <div class="request">Request</div>
    </div>
    <RowComponent v-for="item in items" :key="item.id" v-bind="item" />
  </div>`
}

const PlaycutComponent = {
  props: {
    artistName: String,
    chronOrderID: Number,
    hour: Number,
    id: Number,
    labelName: String,
    releaseTitle: String,
    request: String,
    rotation: String,
    songTitle: String,
    type: String
  },
  template: `<div class="save"><InputComponent v-bind="$props" /></div>
    <div class="rotation">{{ rotation === 'true' ? '*' : '' }}</div>
    <div class="artist">{{ artistName}}</div>
    <div class="song">{{ songTitle }}</div>
    <div class="release">{{ releaseTitle }}</div>
    <div class="label">{{ labelName }}</div>
    <div class="request">{{ request === 'true' ? '*' : '' }}</div>
  `
}

const RowComponent = {
  props: {
    artistName: String,
    chronOrderID: Number,
    hour: Number,
    id: Number,
    labelName: String,
    releaseTitle: String,
    request: String,
    rotation: String,
    songTitle: String,
    type: String
  },
  template: `<div v-if="type==='playcut'" :id="id" class="row playcut">
    <PlaycutComponent v-bind="$props" />
  </div>
  <div v-else-if="type==='breakpoint'" class="row breakpoint" :id="id">
    <td colspan="7">
      -- {{ new Date(hour).getHours() }}:00 Breakpoint --
    </td>
  </div>
  <div v-else-if="type=='talkset'" class="row talkset" :id="id">
    <td colspan="7">
      (talkset)
    </td>
  </div>`
}

setUpLocalStorage()
main()
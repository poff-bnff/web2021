function poff_chat_main () {
    const API_VERSION = '2'
    const CHAT_SERVER = 'https://chat.poff.ee'
    let SOCKET = null
    const HEADER = {
        API_VERSION: API_VERSION,
        USER_ID: null,
        LOCATION: null
    }
    const SUBSCRIBERS = {}

    function initSocket(_user_id, _location) {
        if (!_user_id || !_location) {
            console.log('Not going to join that anonymously', { ...HEADER, _user_id, _location })
            return
        }
        if (SOCKET) {
            // console.log('Enjoy already existing socket', { ...HEADER })
            return
        }
        HEADER.USER_ID = _user_id
        HEADER.LOCATION = slugify(_location)
        SOCKET = io(CHAT_SERVER)
        // console.log('Brand new socket for you', { ...HEADER })
        SOCKET.on('ping', () => {
            SOCKET.emit('pong', { ...HEADER })
        })
    }

    function subscribe(message_type, callback) {
        if (SUBSCRIBERS.hasOwnProperty(message_type)) {
            // console.log({'P-O-M': 'First subscriber to', message_type, HEADER})
            SUBSCRIBERS[message_type].push(callback)
        } else {
            // console.log({'P-O-M': 'Adding subscriber to', message_type, HEADER})
            SUBSCRIBERS[message_type] = [callback]
            SOCKET.on(message_type, (message) => {
                for (const cbf of SUBSCRIBERS[message_type]) {
                    if (!message) {
                        // console.log({'P-O-M': 'Empty message', Socket: SOCKET.id, message_type, message, HEADER})
                        continue
                    }
                    cbf(message)
                }
            })
        }
    }

    function send(message_type, message) {
        SOCKET.emit(message_type, {
            ...HEADER,
            ...message
        })
    }

    function slugify(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-') // Replace spaces with -
            .replace(/[^\w\-]+/g, '') // Remove all non-word chars
            .replace(/\-\-+/g, '-') // Replace multiple - with single -
            .replace(/^-+/, '') // Trim - from start of text
            .replace(/-+$/, '') // Trim - from end of text
    }

    return {
        initSocket: initSocket,
        subscribe: subscribe,
        send: send,
        // track: (user_id, location) => {
        //     initSocket(user_id, location)
        //     // Join
        //     socket.emit('Track me', {user_id: user_id, room_name: location})
        //     // ReJoin
        //     socket.on('Rejoin, please', () => {
        //         socket.emit('Track me', {user_id: user_id, room_name: location})
        //     })
        // },
    }
}

const poff_o_matic = poff_chat_main()

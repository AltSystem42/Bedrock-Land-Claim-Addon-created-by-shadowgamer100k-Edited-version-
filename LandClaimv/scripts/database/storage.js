import { Scoreboard } from "./scoreboard.js"

class Storage {
    #storage = new Map()
    /**
     * @param {string} name 
     */
    constructor (name) {
        this.name = name
        this.#storage = new Map()
        this.objectiveName = `<storage: ${name.replace(/ %§/ig, '_')}>`
        this.scoreboard = new Scoreboard(this.objectiveName)
        const participants = this.scoreboard.getParticipants()
        let deleted = 0
        
        for (const participant of participants) {
            try {
                const object = this.#STRING2JSON(participant.displayName)
                this.#storage.set(object.key, object.value)
            } catch {
                this.scoreboard.removeParticipant(participant.displayName)
                deleted++
            }
        }

        if (deleted > 0) {
            console.error(`§fRemoved ${deleted} invalid string/s from the storage:§t ${this.objectiveName}`)
        }
    }

    /**
     * @param {string|number|boolean} key 
     * @returns {any|undefined} value from key
     */
    get (key) {
        try {
            if (this.#isKeyInvalid(key)) throw 'Invalid key type at [storage, get]'
            return this.copyValue(this.#storage.get(key))
        } catch (error) {
            console.error(error)
        }
    }

    /**
     * @returns {IterableIterator}
     */
    keys () {
        return this.#storage.keys()
    }

    /**
     * @returns {IterableIterator}
     */
    values () {
        return this.#storage.values()
    }

    /**
     * @returns {IterableIterator}
     */
    entries () {
        return this.#storage.entries()
    }
    
    /**
     * @param {string|number|boolean} key 
     * @param {any} value 
     */
    set (key, value) {
        try {
            if (this.#isKeyInvalid(key)) throw 'Invalid key type at [storage, set]'
            if (this.#isValueInvalid(value)) throw 'Invalid value type at [storage, set]'
            if (this.has(key)) this.delete(key)

            this.#storage.set(key, value)
            this.#setInScoreboard(key, value)
        } catch (error) {
            console.error(error)
        }
    }

    /**
     * @param {string|number|boolean} key 
     * @param {(any: value) => newValue} callback 
     */
    overwrite (key, callback) {
        try {
            if (this.#isKeyInvalid(key)) throw 'Invalid key type at [storage, overwrite]'
            let outputValue = callback(this.get(key))
            if (this.#isValueInvalid(outputValue)) throw 'Invalid value type at [storage, overwrite]'

            this.set(key, outputValue)
        } catch (error) {
            console.error(error)
        }
    }
    
    /**
     * @param {string|number|boolean} key 
     * @returns {boolean} has
     */
    has (key) {
        try {
            if (this.#isKeyInvalid(key)) throw 'Invalid key type at [storage, has]'
            return this.#storage.has(key)
        } catch (error) {
            console.error(error)
        }
    }

    /**
     * @param {string|number|boolean} key 
     * @returns {boolean} deleted 
     */
    delete (key) {
        try {
            if (this.#isKeyInvalid(key)) throw 'Invalid key type at [storage, delete]'
            if (this.has(key)) {
                this.#deleteInScoreboard(key, this.get(key))
                this.#storage.delete(key)
                return true
            } else {
                return false
            }
        } catch (error) {
            console.error(error)
        }
    }

    clear () {
        this.#storage.clear()
        this.scoreboard.clearParticipants()
    }

    /**
     * @returns {number} size
     */
    get size () {
        return this.#storage.size
    }

    /**
     * @param {any} value 
     * @returns {any} value copied 
     */
    copyValue (value) {
        const vT = typeof value
        return vT === 'object' ? Array.isArray(vT) ? [...value] : {...value} : value
    }

    /**
     * @param {string|number|boolean} key 
     * @param {any} value 
     */
    #setInScoreboard (key, value) {
        const string = this.#JSON2STRING(key, value)
        this.scoreboard.setScore(string, 0)
    }

    /**
     * @param {string|number|boolean} key 
     * @param {any} value 
     */
    #deleteInScoreboard (key, value) {
        const string = this.#JSON2STRING(key, value)
        this.scoreboard.removeParticipant(string)
    }

    /**
     * @param {string|number|boolean} key 
     * @param {any} value 
     * @returns {string}
     */
    #JSON2STRING (key, value) {
        return JSON.stringify({ key, value }).replace(/"/g, '‟')
    }

    /**
     * @param {string} string 
     * @returns {object<key, value>}
     */
    #STRING2JSON (string) {
        return JSON.parse(string.replace(/‟/g, '"'))
    }

    /**
     * @param {any} key 
     * @returns {boolean}
     */
    #validKeyTypes = ['string', 'number', 'boolean']
    #isKeyInvalid (key) {
        return !this.#validKeyTypes.includes(typeof key)
    }

    /**
     * @param {any} value
     * @returns {boolean}
     */
    #validValueTypes = ['string', 'number', 'boolean', 'object']
    #isValueInvalid (value) {
        return !this.#validValueTypes.includes(typeof value)
    }
}

export {
    Storage
}
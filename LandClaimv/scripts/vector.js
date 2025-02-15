import {world} from '@minecraft/server';

export default class Vector3 {
    constructor (x, y, z) {
        this.x = x
        this.y = y
        this.z = z
    }

    return () {
        return {
            x: this.x,
            y: this.y,
            z: this.z,
        }
    }

    toArray () {
        return [
            this.x,
            this.y,
            this.z,
        ]
    }

    print (join=' ') {
        return this.toArray().join(join)
    }

    static distance (vector1, vector2) {
        return Math.sqrt(
            Math.abs(vector1.x - vector2.x)**2 +
            Math.abs(vector1.y - vector2.y)**2 +
            Math.abs(vector1.z - vector2.z)**2
        )
    }
    
    static subtract (vector1, vector2) {
        return new Vector3(
            vector1.x - vector2.x,
            vector1.y - vector2.y,
            vector1.z - vector2.z,
        )
    }

    static add (vector1, vector2) {
        return new Vector3(
            vector1.x + vector2.x,
            vector1.y + vector2.y,
            vector1.z + vector2.z,
        )
    }

    static multiply (vector1, value) {
        return new Vector3(
            vector1.x * value,
            vector1.y * value,
            vector1.z * value,
        )
    }

    static floor (vector) {
        return new Vector3(
            Math.floor(vector.x),
            Math.floor(vector.y),
            Math.floor(vector.z)
        ) 
    }

    static from (x, y, z) {
        return {
            x: x,
            y: y,
            z: z
        }
    }

    magnitude () {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
      }
    
    normalized () {
        const mag = this.magnitude()
        return mag !== 0 ? new Vector3(this.x / mag, this.y / mag, this.z / mag) : new Vector3(0, 0, 0)
    }
}
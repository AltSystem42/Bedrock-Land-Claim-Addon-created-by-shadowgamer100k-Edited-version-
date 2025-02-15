import { Entity, ScoreboardIdentity, ScoreboardObjective, world } from "@minecraft/server"
const scoreboard = world.scoreboard

class Scoreboard {
    /**
     * @param {string} objectiveId 
     * @param {string?} objectiveDisplayName 
     */
    constructor (objectiveId, objectiveDisplayName=objectiveId) {
        this.objectiveId = objectiveId
        this.objectiveDisplayName = objectiveDisplayName

        if (!Scoreboard.hasObjective(objectiveId)) {
            Scoreboard.addObjective(objectiveId, objectiveDisplayName)
        }

        this.objective = Scoreboard.getObjective(this.objectiveId)
        this.objectiveDisplayName = this.objective.displayName
    }

    /**
     * @param {string} objectiveId 
     * @returns {ScoreboardObjective|undefined} 
     */
    static getObjective (objectiveId) {
        return scoreboard.getObjective(objectiveId)
    }

    /**
     * @returns {ScoreboardIdentity[]}
     */
    static getParticipants () {
        return scoreboard.getParticipants()
    }

    /**
     * @returns {ScoreboardIdentity[]} 
     */
    static getObjectives () {
        return scoreboard.getObjectives()
    }

    /**
     * @param {string} objectiveId 
     * @param {string?} displayName 
     * @returns {ScoreboardObjective}
     */
    static addObjective (objectiveId, displayName=objectiveId) {
        return scoreboard.addObjective(objectiveId, displayName)
    }

    /**
     * @param {string} objectiveId 
     * @returns {boolean}
     */
    static removeObjective (objectiveId) {
        return scoreboard.removeObjective(objectiveId)
    }

    /**
     * @param {string} objectiveId 
     * @returns {boolean}
     */
    static hasObjective (objectiveId) {
        return scoreboard.getObjective(objectiveId) !== undefined
    }

    /**
     * @returns {object|undefined} 
     */
    getObjectiveInfo () {
        const objective = this.objective
        return objective ? { ...objective, size: this.size } : undefined
    }   

    /**
     * @param {string|Entity|ScoreboardIdentity} participant
     * @returns {number|undefined} 
     */
    getScore (participant) {
        return this.objective.getScore(participant)
    }

    /**
     * @param {string|Entity|ScoreboardIdentity} participant
     * @param {number} score 
     * @returns {number|undefined}
     */
    setScore (participant, score) {
        this.objective.setScore(participant, score)
        return this.getScore(participant)
    }

    clearParticipants () {
        scoreboard.getParticipants().forEach(participant => {
            this.removeParticipant(participant.displayName)
        })
    }

    /**
     * @param {string|Entity|ScoreboardIdentity} participant
     * @returns {boolean}
     */
    hasParticipant (participant) {
        return this.objective.hasParticipant(participant)
    }

    /**
     * @returns {ScoreboardIdentity[]} 
     */
    getParticipants () {
        return scoreboard.getObjective(this.objectiveId)?.getParticipants()
    }

    /**
     * @param {string|Entity|ScoreboardIdentity} participant
     * @returns {boolean} 
     */
    removeParticipant (participant) {
        return this.objective.removeParticipant(participant)
    }

    get size () {
        return this.objective.getParticipants().length
    }
}

export {
    Scoreboard
}
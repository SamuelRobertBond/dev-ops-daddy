export interface NoteData{
    id? : string, // This is going to be a uuid
    from : string,
    message : string,
    width? : number
    height? : number
    imageUrl? : string // This may or may not stay
    collisionLayer? : number
    ignoreNote? : boolean
} 
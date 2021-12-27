import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { NoteData } from '../interface/note-data.interface';

@Injectable({
  providedIn: 'root'
})
export class NotesApiService {

  constructor() { }

  getNotes(): Observable<NoteData[]> {

    // TODO: Replace this with API call to note data
    return new Observable((o) => {
      o.next([
        {
          id: "asfd7iyasdfhn",
          from: "Sam",
          message: "This is the note data",
          imageUrl: "https://cdn.discordapp.com/attachments/547641347637510154/925146220886900746/Sakaiger.png",
          width: 128,
          height: 128,
          ignoreNote: true
        },
        {
          id: "afsdjkhlaskdfh",
          from: "Bobby",
          message: "Sam is my good friend",
          imageUrl: "https://media-exp1.licdn.com/dms/image/C5603AQHND4o3AAoBhQ/profile-displayphoto-shrink_200_200/0/1516628535277?e=1646265600&v=beta&t=1jU_32qnmG9W2h33V6LuMPOuS2wH2NN6LFCEiCm7tcg"
        },
        {
          id: "kjadfshlasdfkjh",
          from: "Dave Hearn",
          message: "Feeling Jolly",
          imageUrl: "https://media-exp1.licdn.com/dms/image/C5603AQHND4o3AAoBhQ/profile-displayphoto-shrink_200_200/0/1516628535277?e=1646265600&v=beta&t=1jU_32qnmG9W2h33V6LuMPOuS2wH2NN6LFCEiCm7tcg"
        }
      ])
    })
  }

  addNote(note: NoteData): Observable<NoteData> {
    return new Observable((o) => {
      let n = {...note}
      n.id = (Math.random() * 10000000) + ""
      o.next(n)
    })
  }

}

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
          message: "This is the note data"
        },
        {
          id: "afsdjkhlaskdfh",
          from: "Bobby",
          message: "Sam is my good friend"
        },
        {
          id: "kjadfshlasdfkjh",
          from: "Dave Hearn",
          message: "Feeling Jolly"
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

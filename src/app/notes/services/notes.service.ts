import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { NoteData } from '../interface/note-data.interface';
import { NotesApiService } from './notes-api.service';
import { first } from "rxjs/operators"
import { EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NotesDialogComponent } from '../notes-dialog/notes-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class NotesService {

  notesMap: Map<string, NoteData> = new Map();
  addedNotes: NoteData[] = [];
  removedFromLidNotes: Map<string, NoteData> = new Map();

  noteJarLeaveEmitter : EventEmitter<NoteData> = new EventEmitter<NoteData>();

  private observer: Observer<NoteData>
  private notesStream: Observable<NoteData> = new Observable((o) => {
    this.observer = o
    this.updateNotesData().then(() => {
      let o = this.observer
      let notesUpdateKey = setInterval(() => {
        if(o.closed == true){
          clearInterval(notesUpdateKey)
          return;
        }
        this.updateNotesData()
      }, 10000)
    })

    // Start marble distribution
    this.distributeNotes();
  });


  constructor(private notesApiService: NotesApiService, public dialog: MatDialog) {}

  getIncomingNoteStream(){
    return this.notesStream;
  }

  getNoteDisplayEventEmitter(){
    return this.noteJarLeaveEmitter;
  }

  removeFromJar(note : NoteData) {
    if (this.removedFromLidNotes.has(note.id)) {
      return;
    }

    this.removedFromLidNotes.set(note.id, note);

    this.openNote(note);
  }

  openNote(note : NoteData){
    console.log(note)

    const dialogRef = this.dialog.open(NotesDialogComponent, {
      width: '600px',
      data: note,
      panelClass: "my-mat-dialog-container"
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }

  private async updateNotesData() {
    console.log("Getting Notes!")
    let notes = await this.notesApiService.getNotes().pipe(first()).toPromise()
    for (let n of notes) {
      if (!this.notesMap.has(n.id)) {
        
        this.notesMap.set(n.id, n)
        this.addedNotes.push(n)
      }
    }
  }

  private distributeNotes(){
    if(this.observer == null || this.observer.closed == true){
      return // Close distribution stream if the is no listeners
    }
    
    if(this.addedNotes.length == 0){
      setTimeout(this.distributeNotes.bind(this), 1250)
      return // Cant do anything if there are no notes to distribute
    }

    this.observer.next(this.addedNotes.pop());
    setTimeout(this.distributeNotes.bind(this), 1250)
  }

}

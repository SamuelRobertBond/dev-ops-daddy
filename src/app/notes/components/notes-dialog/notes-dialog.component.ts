import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoteData } from '../../interface/note-data.interface';

@Component({
  selector: 'app-notes-dialog',
  templateUrl: './notes-dialog.component.html',
  styleUrls: ['./notes-dialog.component.scss']
})
export class NotesDialogComponent implements OnInit {

  note: NoteData;

  constructor(@Inject(MAT_DIALOG_DATA) public data: NoteData) {
    this.note = data;
  }

  ngOnInit(): void {
  }

}

import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-create-note',
  templateUrl: './create-note.component.html',
  styleUrls: ['./create-note.component.scss']
})
export class CreateNoteComponent implements OnInit {

  formGroup: FormGroup = new FormGroup({
    from: new FormControl(null, Validators.required),
    message: new FormControl(null, Validators.required)
  });

  constructor() { }

  ngOnInit(): void {
  }

  createNote() {
    console.log(this.note)
  }

  get note() {
    return this.formGroup.value
  }
}

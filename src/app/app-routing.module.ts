import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateNoteComponent } from './create-note/create-note.component';
import { PhysicsComponent } from './physics/physics.component';

const routes: Routes = [
  {
    path: '',
    component: PhysicsComponent
  },
  {
    path: 'add',
    component: CreateNoteComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

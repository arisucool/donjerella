import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/material.module';

@NgModule({
  declarations: [],
  imports: [CommonModule, MaterialModule],
  providers: [],
  exports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule],
})
export class SharedModule {}

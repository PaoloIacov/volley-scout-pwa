import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Giocatore } from '../../model/giocatore';
import { Costanti } from '../../utils/costanti';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dialog-giocatore',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './dialog-giocatore.html',
  styleUrl: './dialog-giocatore.scss'
})
export class DialogGiocatore implements OnInit {
  @Input() giocatore: Giocatore | null = null;
  @Input() show: boolean = false;
  @Output() save = new EventEmitter<Giocatore>();
  @Output() cancel = new EventEmitter<void>();

  giocatoreForm: FormGroup;
  ruoli = Costanti.RUOLI_GIOCATORE;
  isEditMode: boolean = false;

  constructor(private fb: FormBuilder) {
    this.giocatoreForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      cognome: ['', [Validators.required, Validators.minLength(2)]],
      numeroMaglia: [null, [Validators.required, Validators.min(1), Validators.max(99)]],
      ruolo: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  ngOnChanges(): void {
    if (this.giocatore) {
      this.isEditMode = true;
      this.giocatoreForm.patchValue(this.giocatore);
    } else {
      this.isEditMode = false;
      this.giocatoreForm.reset();
    }
  }

  onSave(): void {
    if (this.giocatoreForm.valid) {
      this.save.emit(this.giocatoreForm.value);
      this.giocatoreForm.reset();
    }
  }

  onCancel(): void {
    this.cancel.emit();
    this.giocatoreForm.reset();
  }

  getFieldError(field: string, errorType: string): boolean {
    const control = this.giocatoreForm.get(field);
    return !!(control && control.hasError(errorType) && (control.dirty || control.touched));
  }
}

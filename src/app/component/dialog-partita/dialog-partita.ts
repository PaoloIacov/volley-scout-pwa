import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Partita } from '../../model/partita';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dialog-partita',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './dialog-partita.html',
  styleUrl: './dialog-partita.scss'
})
export class DialogPartita implements OnInit {
  @Input() partita: Partita | null = null;
  @Input() show: boolean = false;
  @Output() save = new EventEmitter<Partita>();
  @Output() cancel = new EventEmitter<void>();

  partitaForm: FormGroup;
  isEditMode: boolean = false;

  constructor(private fb: FormBuilder) {
    this.partitaForm = this.fb.group({
      data: ['', Validators.required],
      avversario: ['', [Validators.required, Validators.minLength(2)]],
      luogo: ['', [Validators.required, Validators.minLength(2)]],
      orarioInizio: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  ngOnChanges(): void {
    if (this.partita) {
      this.isEditMode = true;
      // Converte data italiana in formato ISO per l'input date
      const dataISO = this.convertToISO(this.partita.data);
      this.partitaForm.patchValue({
        ...this.partita,
        data: dataISO
      });
    } else {
      this.isEditMode = false;
      this.partitaForm.reset();
    }
  }

  private convertToISO(dateStr: string): string {
    if (!dateStr) return '';
    // Se è già in formato ISO
    if (dateStr.includes('-')) return dateStr;
    // Se è in formato italiano (gg/mm/aaaa)
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  }

  onSave(): void {
    if (this.partitaForm.valid) {
      this.save.emit(this.partitaForm.value);
      this.partitaForm.reset();
    }
  }

  onCancel(): void {
    this.cancel.emit();
    this.partitaForm.reset();
  }

  getFieldError(field: string, errorType: string): boolean {
    const control = this.partitaForm.get(field);
    return !!(control && control.hasError(errorType) && (control.dirty || control.touched));
  }
}

import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AstroService } from '../../services/astro.service';

@Component({
  selector: 'app-birth-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './birth-form.html',
  styleUrl: './birth-form.css'
})
export class BirthFormComponent {
  userData = {
    name: '',
    dob: '',
    pob: '',
    tob: ''
  };
  loading = false;

  constructor(private astroService: AstroService, private router: Router) { }

  onSubmit() {
    this.loading = true;
    this.astroService.getPrediction(this.userData).subscribe({
      next: (data) => {
        this.loading = false;
        this.router.navigate(['/prediction'], { state: { result: data } });
      },
      error: (err) => {
        this.loading = false;
        console.error('Error fetching prediction:', err);
        alert('Failed to get prediction. Please try again.');
      }
    });
  }
}

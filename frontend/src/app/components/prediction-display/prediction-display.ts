import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-prediction-display',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './prediction-display.html',
  styleUrl: './prediction-display.css'
})
export class PredictionDisplayComponent implements OnInit {
  prediction: any;

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    this.prediction = navigation?.extras.state?.['result'];
  }

  ngOnInit(): void { }
}

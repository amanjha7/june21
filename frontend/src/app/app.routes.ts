import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { BirthFormComponent } from './components/birth-form/birth-form';
import { PredictionDisplayComponent } from './components/prediction-display/prediction-display';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'birth-form', component: BirthFormComponent },
    { path: 'prediction', component: PredictionDisplayComponent },
    { path: '**', redirectTo: '' }
];

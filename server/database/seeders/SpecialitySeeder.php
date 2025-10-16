<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SpecialitySeeder extends Seeder
{
    public function run(): void
    {
        $specialities = [
            [
                'name' => 'Cardiology',
                'description' => 'Heart and cardiovascular system specialists',
                'icon' => 'Heart', // Nom de l'icône Lucide
                'is_active' => true,
            ],
            [
                'name' => 'Pediatrics',
                'description' => 'Medical care for infants, children, and adolescents',
                'icon' => 'Baby',
                'is_active' => true,
            ],
            [
                'name' => 'Neurology',
                'description' => 'Nervous system and brain disorders specialists',
                'icon' => 'Brain',
                'is_active' => true,
            ],
            [
                'name' => 'Obstetrics and Gynecology',
                'description' => 'Women\'s reproductive health specialists',
                'icon' => 'Baby',
                'is_active' => true,
            ],
            [
                'name' => 'Psychiatry',
                'description' => 'Mental health and behavioral disorders specialists',
                'icon' => 'Brain',
                'is_active' => true,
            ],
            [
                'name' => 'Emergency Medicine',
                'description' => 'Acute and urgent medical care specialists',
                'icon' => 'Siren',
                'is_active' => true,
            ],
            [
                'name' => 'Dentistry',
                'description' => 'Oral health and dental care specialists',
                'icon' => 'Smile',
                'is_active' => true,
            ],
            [
                'name' => 'Orthopedics',
                'description' => 'Musculoskeletal system specialists',
                'icon' => 'Bone',
                'is_active' => true,
            ],
            [
                'name' => 'Ophthalmology',
                'description' => 'Eye and vision care specialists',
                'icon' => 'Eye',
                'is_active' => true,
            ],
            [
                'name' => 'Dermatology',
                'description' => 'Skin, hair, and nail specialists',
                'icon' => 'Droplet',
                'is_active' => true,
            ],
        ];

        foreach ($specialities as $speciality) {
            DB::table('specialities')->insert(array_merge($speciality, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }
}

<?php
namespace App\Services;

use Illuminate\Support\Facades\Http;

class NominatimService
{
    private $baseUrl = 'https://nominatim.openstreetmap.org';

    public function geocode($address)
    {
        try {
            $response = Http::withHeaders([
                'User-Agent' => 'CabinetApp/1.0'
            ])->get($this->baseUrl . '/search', [
                'q' => $address,
                'format' => 'json',
                'limit' => 5,
                'countrycodes' => 'ma',
                'accept-language' => 'ar,fr,en'
            ]);

            return $response->json();
        } catch (\Exception $e) {
            return [];
        }
    }

    public function reverseGeocode($lat, $lon)
    {
        try {
            $response = Http::withHeaders([
                'User-Agent' => 'CabinetApp/1.0'
            ])->get($this->baseUrl . '/reverse', [
                'lat' => $lat,
                'lon' => $lon,
                'format' => 'json',
                'accept-language' => 'ar,fr,en'
            ]);

            return $response->json();
        } catch (\Exception $e) {
            return null;
        }
    }
}

package com.breadbread.global.util;

/** 위경도 기준 거리 계산 */
public final class GeoDistance {

    private static final double EARTH_RADIUS_METERS = 6_371_000d;

    private GeoDistance() {}

    public static boolean isValidCoordinate(double latitude, double longitude) {
        if (!Double.isFinite(latitude) || !Double.isFinite(longitude)) return false;
        if (latitude == 0d && longitude == 0d) return false;
        return latitude >= -90d && latitude <= 90d && longitude >= -180d && longitude <= 180d;
    }

    /** Haversine 거리 (미터) */
    public static double metersBetween(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2)
                        + Math.cos(Math.toRadians(lat1))
                                * Math.cos(Math.toRadians(lat2))
                                * Math.sin(dLng / 2)
                                * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_METERS * c;
    }
}

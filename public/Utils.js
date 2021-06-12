function linearToInfinite(turnProp) {
    // see y = 1/(-x + 1) - 1 for x = [0, 1]
    if(turnProp < 0 || turnProp > 1) return NaN; 
    return 1/(-turnProp + 1) - 1;
}
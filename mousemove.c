#include <stdio.h>
#include <ApplicationServices/ApplicationServices.h>

int main() {
    setbuf(stdout, NULL);
    setbuf(stdin, NULL);
    char line[256];
    while (fgets(line, sizeof(line), stdin)) {
        double dx, dy;
        if (line[0] == 's') {
            CGDirectDisplayID d = CGMainDisplayID();
            size_t w = CGDisplayPixelsWide(d);
            size_t h = CGDisplayPixelsHigh(d);
            fprintf(stdout, "s %zu %zu\n", w, h);
        } else if (sscanf(line, "a %lf %lf", &dx, &dy) == 2) {
            CGPoint pos = { dx, dy };
            CGEventRef move = CGEventCreateMouseEvent(NULL, kCGEventMouseMoved, pos, kCGMouseButtonLeft);
            CGEventPost(kCGHIDEventTap, move);
            CFRelease(move);
            fputs("ok\n", stdout);
        } else if (sscanf(line, "m %lf %lf", &dx, &dy) == 2) {
            CGEventRef ev = CGEventCreate(NULL);
            CGPoint pos = CGEventGetLocation(ev);
            CFRelease(ev);
            pos.x += dx;
            pos.y += dy;
            CGEventRef move = CGEventCreateMouseEvent(NULL, kCGEventMouseMoved, pos, kCGMouseButtonLeft);
            CGEventPost(kCGHIDEventTap, move);
            CFRelease(move);
            fputs("ok\n", stdout);
        }
    }
    return 0;
}

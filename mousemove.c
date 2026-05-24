#include <stdio.h>
#include <ApplicationServices/ApplicationServices.h>

int main() {
    setbuf(stdout, NULL);
    setbuf(stdin, NULL);
    char line[256];
    while (fgets(line, sizeof(line), stdin)) {
        double dx, dy;
        if (sscanf(line, "m %lf %lf", &dx, &dy) == 2) {
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

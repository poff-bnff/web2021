#!/bin/sh

/bin/echo "Welcome!
Your choices are:
1    Git pull
----------------------------
2    Build hoff.ee
3    Build filmikool.poff.ee
----------------------------
4    LIVE Hoff.ee
5    LIVE filmikool.poff.ee
----------------------------
q    Quit"

/bin/echo
/bin/echo "Your choice:"

read ans

while [ "$ans" != "q" ]
do
   case "$ans" in
      1)
         git pull
         ;;
      2)
         bash /srv/ssg/build_hoff.sh
         ;;
      3)
         bash /srv/ssg/build_filmikool.sh
         ;;
      4)
         bash /srv/ssg/deploy.sh hoff.ee
         ;;
      5)
         bash /srv/ssg/deploy.sh filmikool.poff.ee
         ;;
      q)
         /bin/echo "Goodbye"
         exit 0
         ;;
      *)
         /bin/echo "Invalid choice '$ans': please try again"
         ;;
   esac
/bin/echo
/bin/echo "Your choices are:
1    Git pull
-------------------------------
2    Build hoff.ee
3    Build filmikool.poff.ee
-------------------------------
4    LIVE hoff.ee
5    LIVE filmikool.poff.ee
-------------------------------
q    Quit"

/bin/echo
/bin/echo "Your choice:"

   read ans
done
exit 0

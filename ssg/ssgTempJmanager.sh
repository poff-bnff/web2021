#!/bin/sh

/bin/echo "Welcome!
Your choices are:
1    Cassette and film stills for Votemo
----------------------------

q    Quit"

/bin/echo
/bin/echo "Your choice:"

read ans

while [ "$ans" != "q" ]
do
   case "$ans" in
      1)
         node helpers/cassettes_csv.js 
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
1    Cassette and film stills for Votemo
----------------------------

q    Quit"

/bin/echo
/bin/echo "Your choice:"

   read ans
done
exit 0

# gomoku-go

Beautiful website with options to play local and online gomoku and go.

## Rules
### Gomoku
* Black goes first
* Alternate turns, placing down a piece on an empty intersection each turn
* First to connect (vertically, horizontally, or diagonally) exactly 5 pieces of their color wins
### Go
* Black goes first
* Alternate turns, with the option of placing down a piece on an empty intersection or passing each turn
* When both colors consecutively pass, game ends and board is scored
* Liberties: a piece or a chain of directly adjacent pieces of the same color has liberties if it or any of its constituents is directly adjacent to an empty intersection
* Pieces are captured when they have no liberties left (i.e. adjacently surrounded by opposing pieces)
* Capturing opposing pieces takes higher priority than self capture
* Self-capture is illegal (i.e. a player cannot make a move that would instantly result in their piece(s) being captured)
* Ko rule: a move cannot replicate a previous board position (prevents infinite gameplay)
* Board is scored using area scoring: Color's score = # of pieces of that color on board + # of empty intersections exclusively surrounded by that color
* Color with higher score wins

## Online game rooms
Create or join an online game room for either gomoku or go by entering desired room code into the "Join code" input box.
The room can be exited by pressing the "Restart [game type]" button, by entering a different room code in the input box, by refreshing the page, or by closing the tab.

## Commands
Commands are featured in the chat, both local and online, and a list of their calls and functionalities can be produced by entering "/cmd" into the chat input box.

## Chinese Game Suite
Proud part of the Chinese Game Suite.  
Made in conjunction with:  
* Aplet123's [Chinese chess project](https://github.com/Aplet123/chinese-chess)  
* A.'s Mahjong project
